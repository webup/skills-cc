#!/usr/bin/env bun

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const MODELS_DEV_CATALOG_URL = 'https://models.dev/catalog.json'
const DEFAULT_PROVIDER = 'anthropic'

const args = process.argv.slice(2)

function getArg(name, fallback = '') {
  const index = args.indexOf(`--${name}`)
  return index >= 0 && index + 1 < args.length ? args[index + 1] : fallback
}

function hasFlag(name) {
  return args.includes(`--${name}`)
}

function numberArg(name) {
  const raw = getArg(name, '0')
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`--${name} must be a non-negative number`)
  }
  return value
}

function cacheBaseDir() {
  if (process.env.XDG_CACHE_HOME) return process.env.XDG_CACHE_HOME
  return join(homedir(), '.cache')
}

function cacheDir() {
  return getArg('cache-dir', join(cacheBaseDir(), 'webup-model-price'))
}

function ttlMs() {
  const seconds = Number(getArg('ttl-seconds', '86400'))
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new Error('--ttl-seconds must be a non-negative number')
  }
  return seconds * 1000
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function cachedCatalogPath() {
  return join(cacheDir(), 'catalog.json')
}

function cacheIsFresh(path) {
  if (!existsSync(path)) return false
  return Date.now() - statSync(path).mtimeMs <= ttlMs()
}

async function loadCatalog() {
  const catalogPath = getArg('catalog')
  if (catalogPath) return readJson(catalogPath)

  const path = cachedCatalogPath()
  if (!hasFlag('refresh') && cacheIsFresh(path)) return readJson(path)

  try {
    const response = await fetch(MODELS_DEV_CATALOG_URL)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const text = await response.text()
    const parsed = JSON.parse(text)
    mkdirSync(cacheDir(), { recursive: true })
    writeFileSync(path, JSON.stringify(parsed))
    return parsed
  } catch (error) {
    if (existsSync(path)) return readJson(path)
    throw new Error(`Unable to fetch ${MODELS_DEV_CATALOG_URL}: ${error.message}`)
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function modelCandidates(providerId, model) {
  const candidates = [model]
  if (model.startsWith(`${providerId}/`)) {
    candidates.push(model.slice(providerId.length + 1))
  }
  if (providerId === DEFAULT_PROVIDER && model.startsWith(`${DEFAULT_PROVIDER}/`)) {
    candidates.push(model.slice(DEFAULT_PROVIDER.length + 1))
  }
  return unique(candidates)
}

function normalizeCost(cost = {}) {
  const input = Number(cost.input ?? 0)
  const output = Number(cost.output ?? 0)
  const cacheRead = Number(cost.cache_read ?? cost.cacheRead ?? input)
  const cacheWrite = Number(cost.cache_write ?? cost.cacheWrite ?? input)
  if (![input, output, cacheRead, cacheWrite].every(Number.isFinite)) return null
  return { input, output, cacheRead, cacheWrite }
}

function findInProvider(providerId, providerData, model) {
  const models = providerData?.models ?? {}
  for (const candidate of modelCandidates(providerId, model)) {
    if (models[candidate]?.cost) {
      return { providerId, providerData, modelKey: candidate, modelData: models[candidate] }
    }
  }
  for (const [modelKey, modelData] of Object.entries(models)) {
    if (modelData?.id === model && modelData?.cost) {
      return { providerId, providerData, modelKey, modelData }
    }
  }
  return null
}

function findAll(catalog, model) {
  const providers = catalog.providers ?? {}
  const matches = []
  for (const [providerId, providerData] of Object.entries(providers)) {
    const match = findInProvider(providerId, providerData, model)
    if (match) matches.push(match)
  }
  return matches
}

function roundUsd(value) {
  return Number(value.toFixed(8))
}

function buildResult(match, usage) {
  const costPerMillion = normalizeCost(match.modelData.cost)
  const result = {
    source: 'models.dev',
    provider: match.providerId,
    providerName: match.providerData.name ?? match.providerId,
    model: match.modelData.id ?? match.modelKey,
    modelKey: match.modelKey,
    displayName: match.modelData.name ?? match.modelData.id ?? match.modelKey,
    updatedAt: match.modelData.last_updated ?? match.modelData.updated_at ?? null,
    costPerMillion,
  }

  const usageTotal = usage.input + usage.output + usage.cacheRead + usage.cacheWrite
  if (usageTotal > 0) {
    result.usageTokens = usage
    result.estimatedCostUsd = roundUsd(
      (
        usage.input * costPerMillion.input +
        usage.output * costPerMillion.output +
        usage.cacheRead * costPerMillion.cacheRead +
        usage.cacheWrite * costPerMillion.cacheWrite
      ) / 1000000,
    )
  }

  return result
}

function usageArgs() {
  return {
    input: numberArg('input-tokens'),
    output: numberArg('output-tokens'),
    cacheRead: numberArg('cache-read-tokens'),
    cacheWrite: numberArg('cache-write-tokens'),
  }
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

function fail(message, code = 1) {
  process.stderr.write(`${message}\n`)
  process.exit(code)
}

async function main() {
  const model = getArg('model')
  if (!model) fail('--model is required')

  const provider = getArg('provider')
  const allProviders = hasFlag('all')
  const noDefaultProvider = hasFlag('no-default-provider')
  const catalog = await loadCatalog()
  const usage = usageArgs()

  if (provider) {
    const providerData = catalog.providers?.[provider]
    if (!providerData) fail(`Provider not found: ${provider}`)
    const match = findInProvider(provider, providerData, model)
    if (!match) fail(`Model not found for provider ${provider}: ${model}`, 2)
    printJson(buildResult(match, usage))
    return
  }

  const matches = findAll(catalog, model)
  if (allProviders) {
    printJson({
      source: 'models.dev',
      model,
      matches: matches.map((match) => buildResult(match, usage)),
    })
    return
  }

  if (!noDefaultProvider) {
    const defaultProvider = catalog.providers?.[DEFAULT_PROVIDER]
    const defaultMatch = defaultProvider ? findInProvider(DEFAULT_PROVIDER, defaultProvider, model) : null
    if (defaultMatch) {
      printJson(buildResult(defaultMatch, usage))
      return
    }
  }

  if (matches.length === 1) {
    printJson(buildResult(matches[0], usage))
    return
  }

  if (matches.length > 1) {
    const providers = matches.map((match) => match.providerId).join(', ')
    fail(`Ambiguous model ${model} matched providers: ${providers}. Pass --provider or --all.`, 2)
  }

  fail(`Model not found: ${model}`, 2)
}

main().catch((error) => fail(error.message))
