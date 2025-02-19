const { fetchURL } = require("../helper/utils");
const { V1_POOLS, TOKENS_IN_LEGACY_VERSIONS } = require("./addresses");
const { sumTokens2 } = require('../helper/unwrapLPs')

const YIELD_VERSION = '0xA5AdC5484f9997fBF7D405b9AA62A7d88883C345'
const YIELDLESS_VERSION = '0x059d306A25c4cE8D7437D25743a8B94520536BD5'
const VULN_VERSION = '0x230C63702D1B5034461ab2ca889a30E343D81349'
const BETA_VERSION = '0x24F85583FAa9F8BD0B8Aa7B1D1f4f53F0F450038'

const LEGACY_VERSIONS = {
  optimism: [BETA_VERSION, VULN_VERSION, YIELDLESS_VERSION],
  polygon: [VULN_VERSION, YIELDLESS_VERSION]
}

async function getTokensInChain(chain) {
  const { data } = await fetchURL(`https://api.mean.finance/v1/dca/networks/${chain}/tokens`)
  return data.map(({ address }) => address)
    .filter(address => address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
}

function getV2TvlObject(chain) {
  return {
    tvl: (_, __, chainBlocks) => getV2TVL(chain, chainBlocks[chain])
  }
}

async function getV2TVL(chain, block) {
  const legacyVersions = LEGACY_VERSIONS[chain] ?? []
  const legacyTokens = TOKENS_IN_LEGACY_VERSIONS[chain] ?? []
  const tokens = await getTokensInChain(chain)
  const versions = [
    ...legacyVersions.map(contract => ({ contract, tokens: legacyTokens })),
    { contract: YIELD_VERSION, tokens }
  ]

  const toa = versions.map(({ contract, tokens }) => tokens.map(t => ([t, contract]))).flat()
  return sumTokens2({ chain, block, tokensAndOwners: toa})
}

async function ethTvl(timestamp, block) {
  const toa = []
  // Calls for tokens in pair and balances of them then adds to balance
  for (let i = 0; i < V1_POOLS.length; i++) {
    const { pool, tokenA, tokenB } = V1_POOLS[i]
    toa.push([tokenA, pool], [tokenB, pool])
  }

  return sumTokens2({ tokensAndOwners: toa, block, });
}

module.exports = {
  ethereum: {
    tvl: ethTvl
  },
  optimism: getV2TvlObject('optimism'),
  polygon: getV2TvlObject('polygon'),
  arbitrum: getV2TvlObject('arbitrum'),
   hallmarks: [
    [1638850958, "V2 Beta launch on Optimism"],
    [1643602958, "V2 full launch"],
    [1646367758, "Deployment on Polygon"],
    [1650082958, "Protocol is paused because a non-critical vulnerability"],
    [1653366158, "V2 Relaunch"],
    [1654057358, "OP launch brings more users into Optimism and benefits Mean"],
    [1666364400, "Yield-While-DCA launch"],
  ]
};
