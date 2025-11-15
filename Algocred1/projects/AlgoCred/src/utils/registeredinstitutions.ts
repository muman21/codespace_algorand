// src/utils/registeredInstitutions.ts

export type Institution = {
  wallet: string
  name: string
  feeExempt?: boolean // 🟢 Added this optional flag
}

export const registeredInstitutions: Institution[] = [
  {
    wallet: 'M62NKUYCQT2ESAMEOSGJPTNFCEESEPKJAMSQCPCYNMFJQ4N7VSSKKS6EAM',
    name: 'Karachi University',
    feeExempt: true, // ❌ Skip payment
  },
  {
    wallet: '37IWAMOV226G32SEBQEDGAK6HQAB5QNXAHWITB2BYLFLECG3OMEFIN77QI',
    name: 'Sindh Madressatul Islam University',
    feeExempt: true, // ❌ Skip payment
  },
  {
    wallet: 'BY5TDHHKSB224JZVCNEEEVADRK7FWYKJAOCKB3KZYAVRL6QZW6OYAVK5NM',
    name: 'ABC University',
    feeExempt: false, // ✅ Payment required
  },
  {
    wallet: 'FEYL3CZYH4MIILAD2S76YMQQOVLRCGWO4VFNLX3KCRG4WLAC7FAYDWJKVA',
    name: 'XYZ University',
    feeExempt: true, // ❌ Skip payment
  },
  {
    wallet: 'UZ64IM4OZIICXLXDNVAQ73JT6DNHYKPU2NG4VD6AH55W5FYPMNFH5JCB24',
    name: 'LMN University',
    feeExempt: false, // ✅ Payment required
  },
]
