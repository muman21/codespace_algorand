// src/utils/registeredInstitutions.ts

export type Institution = {
  wallet: string
  name: string
}

export const registeredInstitutions: Institution[] = [
  {
    wallet: 'M62NKUYCQT2ESAMEOSGJPTNFCEESEPKJAMSQCPCYNMFJQ4N7VSSKKS6EAM',
    name: 'Darul Uloom Memon',
  },
  {
    wallet: '37IWAMOV226G32SEBQEDGAK6HQAB5QNXAHWITB2BYLFLECG3OMEFIN77QI',
    name: 'SMIU',
  },
  {
    wallet: 'BY5TDHHKSB224JZVCNEEEVADRK7FWYKJAOCKB3KZYAVRL6QZW6OYAVK5NM',
    name: 'ABC University',
  },
  {
    wallet: 'FEYL3CZYH4MIILAD2S76YMQQOVLRCGWO4VFNLX3KCRG4WLAC7FAYDWJKVA',
    name: 'XYZ University',
  },
]
