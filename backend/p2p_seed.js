const test = process.env.TEST || false

export const p2p_seed = [
    !test ?? 'stated.rixdata.net'
]
