import type { Locale } from "@/lib/i18n";

export type ProductProfile = {
  id: string;
  label: string;
  labelHi: string;
  aliases: string[];
  category: string;
  standards: string[];
  scheme: "scheme1" | "scheme2" | "hallmark" | "scheme4" | "voluntary";
  mandatory: boolean;
  note: Record<Locale, string>;
};

export const SCHEME_LABEL: Record<string, string> = {
  scheme1: "ISI Mark — BIS Product Certification (Scheme-I)",
  scheme2: "Compulsory Registration Scheme (Scheme-II / CRS)",
  hallmark: "BIS Hallmarking Scheme (Gold & Silver Jewellery)",
  scheme4: "Certificate of Conformity (Scheme-IV)",
  voluntary: "Voluntary BIS Certification",
};

export const SCHEME_LABEL_HI: Record<string, string> = {
  scheme1: "ISI चिह्न — BIS उत्पाद प्रमाणन (योजना-I)",
  scheme2: "अनिवार्य पंजीकरण योजना (योजना-II / CRS)",
  hallmark: "BIS हॉलमार्किंग योजना (स्वर्ण एवं रजत आभूषण)",
  scheme4: "अनुरूपता प्रमाणपत्र (योजना-IV)",
  voluntary: "स्वैच्छिक BIS प्रमाणन",
};

export const PRODUCTS: ProductProfile[] = [
  {
    id: "cement",
    label: "Cement (OPC / PPC)",
    labelHi: "सीमेंट (OPC / PPC)",
    aliases: ["cement", "opc", "ppc", "portland", "concrete mix", "सीमेंट", "काँक्रीट"],
    category: "construction",
    standards: ["IS 269:2015", "IS 1489-1:2015", "IS 8112:2013", "IS 12269:2013"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "Cement is covered by a Quality Control Order — manufacture, sale and import of cement require a valid BIS licence (ISI mark) under Scheme-I before it reaches the market.",
      hi: "सीमेंट गुणवत्ता नियंत्रण आदेश (QCO) के अंतर्गत आता है — सीमेंट का निर्माण, विक्रय व आयात के लिए योजना-I के अंतर्गत वैध BIS लाइसेंस (ISI चिह्न) अनिवार्य है।",
    },
  },
  {
    id: "tmt",
    label: "TMT / structural steel bars",
    labelHi: "TMT / संरचनात्मक इस्पात",
    aliases: ["tmt", "rebar", "steel bar", "tor steel", "saria", "structural steel", "सरिया", "इस्पात", "tmt bar"],
    category: "construction",
    standards: ["IS 1786:2008", "IS 2062:2011"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "Steel for concrete reinforcement and structural steel are under mandatory certification. Every bundle must carry the ISI mark, licence number (CM/L-) and grade (e.g. Fe 500, Fe 550).",
      hi: "कंक्रीट सुदृढ़ीकरण इस्पात एवं संरचनात्मक इस्पात पर अनिवार्य प्रमाणन लागू है। प्रत्येक गठ्ठरी पर ISI चिह्न, लाइसेंस संख्या (CM/L-) व ग्रेड (जैसे Fe 500, Fe 550) अंकित होना चाहिए।",
    },
  },
  {
    id: "gold",
    label: "Gold jewellery & artefacts",
    labelHi: "स्वर्ण आभूषण",
    aliases: ["gold", "jewellery", "jewelry", "ornament", "bangle", "sona", "सोना", "आभूषण", "gold coin"],
    category: "hallmark",
    standards: ["IS 1417:2016"],
    scheme: "hallmark",
    mandatory: true,
    note: {
      en: "Sale of gold jewellery/artefacts is allowed only with BIS hallmark in notified districts. Each piece must carry the BIS Standard Mark, fineness grade (e.g. 22K916) and a 6-digit alphanumeric HUID.",
      hi: "अधिसूचित जिलों में स्वर्ण आभूषण/वस्तुएँ केवल BIS हॉलमार्क के साथ बेची जा सकती हैं। प्रत्येक वस्तु पर BIS मानक चिह्न, शुद्धता ग्रेड (जैसे 22K916) और 6-अंकों का HUID अनिवार्य है।",
    },
  },
  {
    id: "silver",
    label: "Silver jewellery & artefacts",
    labelHi: "रजत आभूषण",
    aliases: ["silver", "chandi", "चांदी", "रजत"],
    category: "hallmark",
    standards: ["IS 2112:2014"],
    scheme: "hallmark",
    mandatory: false,
    note: {
      en: "Hallmarking of silver articles is voluntary under IS 2112:2014. Jewellers may register with BIS and get articles hallmarked at Assaying & Hallmarking Centres for consumer trust.",
      hi: "रजत वस्तुओं की हॉलमार्किंग IS 2112:2014 के अंतर्गत स्वैच्छिक है। जॉइलर्स BIS पंजीकरण कराकर उपभोक्ता विश्वास हेतु आर्टिकल हॉलमार्क करवा सकते हैं।",
    },
  },
  {
    id: "it-electronics",
    label: "IT & AV electronics (laptops, adapters, TVs)",
    labelHi: "IT एवं AV इलेक्ट्रॉनिक्स (लैपटॉप, एडॉप्टर, TV)",
    aliases: ["laptop", "adapter", "charger", "notebook", "television", "led tv", "monitor", "printer", "speaker", "bluetooth", "earphone", "headphone", "मोबाइल चार्जर", "लैपटॉप", "टीवी"],
    category: "electronics",
    standards: ["IS 13252-1:2010", "IS 616:2017"],
    scheme: "scheme2",
    mandatory: true,
    note: {
      en: "Most IT & audio-video electronics are regulated under the Compulsory Registration Scheme (CRS, Scheme-II). Products must be tested in BIS-recognized labs and display the Standard Mark with an R-registration number before sale in India.",
      hi: "अधिकांश IT व ऑडियो-वीडियो इलेक्ट्रॉनिक्स अनिवार्य पंजीकरण योजना (CRS, योजना-II) के अंतर्गत आते हैं। भारत में विक्रय से पहले उत्पाद BIS-मान्यता प्राप्त प्रयोगशाला में परीक्षित होना चाहिए तथा R-पंजीकरण संख्या सहित मानक चिह्न प्रदर्शित करना अनिवार्य है।",
    },
  },
  {
    id: "battery",
    label: "Sealed secondary cells / lithium batteries",
    labelHi: "सीलबंद सेकेंडरी सेल / लिथियम बैटरी",
    aliases: ["battery", "lithium", "li-ion", "cell", "power bank", "powerbank", "बैटरी"],
    category: "electronics",
    standards: ["IS 16046:2018"],
    scheme: "scheme2",
    mandatory: true,
    note: {
      en: "Portable sealed secondary cells and lithium battery packs are covered under CRS (IS 16046 aligned to IEC 62133). Registration is per-brand/series based on test reports from BIS-recognized laboratories.",
      hi: "पोर्टेबल सीलबंद सेकेंडरी सेल व लिथियम बैटरी पैक CRS (IS 16046, IEC 62133 के अनुरूप) के अंतर्गत आते हैं। पंजीकरण BIS-मान्यता प्राप्त प्रयोगशाला की टेस्ट रिपोर्ट के आधार पर ब्रांड/सीरीज़वार होता है।",
    },
  },
  {
    id: "cables",
    label: "PVC insulated wires & cables",
    labelHi: "PVC इन्सुलेटेड तार व केबल",
    aliases: ["wire", "cable", "wiring", "tarang", "तार", "केबल", "flexible wire"],
    category: "electrical",
    standards: ["IS 694:2010", "IS 1554-1:1988", "IS 7098-1:1988"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "PVC-insulated cables for voltages up to 1100 V (IS 694) are under a Quality Control Order — ISI mark is mandatory. Heavy-duty PVC (IS 1554) and XLPE (IS 7098) cables are also commonly certified under Scheme-I.",
      hi: "1100 V तक के PVC इन्सुलेटेड केबल (IS 694) गुणवत्ता नियंत्रण आदेश के अंतर्गत आते हैं — ISI चिह्न अनिवार्य है। हेवी-ड्यूटी PVC (IS 1554) व XLPE (IS 7098) केबल भी सामान्यतः योजना-I में प्रमाणित होते हैं।",
    },
  },
  {
    id: "plugs-switches",
    label: "Plugs, socket-outlets & switches",
    labelHi: "प्लग, सॉकेट एवं स्विच",
    aliases: ["plug", "socket", "switch", "प्लग", "स्विच", "सॉकेट"],
    category: "electrical",
    standards: ["IS 1293:2019", "IS 3854:1997"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "Plugs & socket-outlets (IS 1293) and domestic switches (IS 3854) are brought under QCOs — look for the ISI mark and rating (6 A / 16 A) on every accessory.",
      hi: "प्लग व सॉकेट-आउटलेट (IS 1293) तथा घरेलू स्विच (IS 3854) QCO के अंतर्गत आते हैं — प्रत्येक accessory पर ISI चिह्न व रेटिंग (6 A / 16 A) देखें।",
    },
  },
  {
    id: "fans",
    label: "Electric ceiling fans",
    labelHi: "इलेक्ट्रिक छत पंखे",
    aliases: ["fan", "ceiling fan", "पंखा"],
    category: "electrical",
    standards: ["IS 374:2019"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "Ceiling fans are under QCO — ISI mark per IS 374:2019 is mandatory. The standard also covers energy-efficient service value requirements; higher star rating means lower power consumption.",
      hi: "छत के पंखे QCO के अंतर्गत आते हैं — IS 374:2019 के अनुरूप ISI चिह्न अनिवार्य है। मानक में ऊर्जा-दक्षता (service value) की अपेक्षाएँ भी शामिल हैं; अधिक स्टार रेटिंग अर्थात कम बिजली खपत।",
    },
  },
  {
    id: "led",
    label: "Self-ballasted LED lamps",
    labelHi: "सेल्फ-बैलास्टेड LED लैंप",
    aliases: ["led", "led bulb", "led lamp", "tube light", "बल्ब", "एलईडी"],
    category: "electronics",
    standards: ["IS 16102-1:2012"],
    scheme: "scheme2",
    mandatory: true,
    note: {
      en: "Self-ballasted LED lamps for general lighting are under CRS (IS 16102 Part 1, safety). The lamp and its packaging must show the Standard Mark and R-number.",
      hi: "सामान्य प्रकाशन हेतु सेल्फ-बैलास्टेड LED लैंप CRS (IS 16102 भाग 1, सुरक्षा) के अंतर्गत आते हैं। लैंप व पैकेजिंग पर मानक चिह्न और R-संख्या अंकित होनी चाहिए।",
    },
  },
  {
    id: "helmet",
    label: "Two-wheeler protective helmets",
    labelHi: "दोपहिया सुरक्षा हेलमेट",
    aliases: ["helmet", "हेलमेट", "rider helmet"],
    category: "mechanical",
    standards: ["IS 4151:2015"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "Protective helmets for motorcycle riders are under mandatory certification (IS 4151:2015). Buying a non-ISI helmet is both illegal for manufacturers to sell and unsafe — check the mark inside the shell.",
      hi: "मोटरसाइकिल सवारों के सुरक्षा हेलमेट पर अनिवार्य प्रमाणन (IS 4151:2015) लागू है। बिना ISI वाला हेलमेट बेचना अवैध व असुरक्षित है — शेल के अंदर चिह्न अवश्य जाँचें।",
    },
  },
  {
    id: "cooker",
    label: "Domestic pressure cookers",
    labelHi: "घरेलू प्रेशर कुकर",
    aliases: ["cooker", "pressure cooker", "कुकर"],
    category: "consumer",
    standards: ["IS 2347:2017"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "Domestic pressure cookers are under QCO (IS 2347:2017). The standard specifies material thickness, safety valve, fusible plug and bursting-pressure tests.",
      hi: "घरेलू प्रेशर कुकर QCO (IS 2347:2017) के अंतर्गत आते हैं। मानक में धातु की मोटाई, सेफ्टी वॉल्व, फ्यूज़िबल प्लग व बर्स्टिंग-प्रेशर परीक्षण निर्धारित हैं।",
    },
  },
  {
    id: "packaged-water",
    label: "Packaged drinking water",
    labelHi: "पैकेज्ड पेयजल",
    aliases: ["bottle water", "water bottle", "packaged water", "mineral water", "पानी की बोतल", "पेयजल"],
    category: "food",
    standards: ["IS 14543:2016", "IS 13428:2005"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "Packaged drinking water (IS 14543) and packaged natural mineral water (IS 13428) must carry the ISI mark — every bottle sold in India requires BIS certification of the bottling plant.",
      hi: "पैकेज्ड पेयजल (IS 14543) व पैकेज्ड प्राकृतिक खनिज जल (IS 13428) पर ISI चिह्न अनिवार्य है — भारत में बेची जाने वाली प्रत्येक बोतल के लिए बॉटलिंग प्लांट का BIS प्रमाणन आवश्यक है।",
    },
  },
  {
    id: "pipes",
    label: "HDPE / PVC-u pipes for water supply",
    labelHi: "जलापूर्ति हेतु HDPE / PVC-u पाइप",
    aliases: ["pipe", "hdpe", "pvc pipe", "upvc", "पाइप", "पीवीसी"],
    category: "plastics",
    standards: ["IS 4984:2016", "IS 4985:2021"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "HDPE pipes (IS 4984) and uPVC pipes for potable water (IS 4985) are covered by QCOs. Pipes must be marked with ISI, pressure class and manufacturing date code along the length.",
      hi: "HDPE पाइप (IS 4984) व पेयजल हेतु uPVC पाइप (IS 4985) QCO के अंतर्गत आते हैं। पाइप पर लंबाई के साथ ISI चिह्न, प्रेशर क्लास व निर्माण तिथि-कोड अंकित होना चाहिए।",
    },
  },
  {
    id: "toys",
    label: "Toys (electric & non-electric)",
    labelHi: "खिलौने (इलेक्ट्रिक व नॉन-इलेक्ट्रिक)",
    aliases: ["toy", "toys", "खिलौना", "खिलौने", "doll"],
    category: "consumer",
    standards: ["IS 9873-1:2019", "IS 9873-2:2017", "IS 9873-3:2017"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "All toys sold in India — domestic or imported — must conform to the Toys (QCO) and carry the ISI mark per the IS 9873 series (mechanical, flammability, chemical migration). Electric toys additionally follow IS 15644.",
      hi: "भारत में बिकने वाले सभी खिलौने — देशी या आयातित — Toys (QCO) के अनुरूप होने चाहिए और IS 9873 श्रृंखला (यांत्रिक, ज्वलनशीलता, रासायनिक) के अनुसार ISI चिह्न धारण करें। इलेक्ट्रिक खिलौनों पर IS 15644 भी लागू होता है।",
    },
  },
  {
    id: "cylinders",
    label: "LPG cylinders, stoves & regulators",
    labelHi: "LPG सिलिंडर, स्टोव व रेगुलेटर",
    aliases: ["lpg", "cylinder", "gas stove", "गैस सिलिंडर", "स्टोव", "regulator"],
    category: "mechanical",
    standards: ["IS 3196:2013", "IS 4246:2002"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "Welded low-carbon steel LPG cylinders (IS 3196) and domestic LPG stoves (IS 4246) are under mandatory certification — critical for household safety.",
      hi: "वेल्डेड निम्न-कार्बन स्टील LPG सिलिंडर (IS 3196) व घरेलू LPG स्टोव (IS 4246) अनिवार्य प्रमाणन के अंतर्गत हैं — घरेलू सुरक्षा के लिए अत्यंत महत्वपूर्ण।",
    },
  },
  {
    id: "meters",
    label: "Static & smart energy meters",
    labelHi: "स्टेटिक व स्मार्ट ऊर्जा मीटर",
    aliases: ["meter", "energy meter", "smart meter", "बिजली मीटर"],
    category: "electrical",
    standards: ["IS 13779:1999", "IS 16444:2015"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "AC static watt-hour meters (IS 13779) and smart meters (IS 16444) are covered under QCOs — utilities procure only BIS-certified meters.",
      hi: "AC स्टेटिक वॉट-आवर मीटर (IS 13779) व स्मार्ट मीटर (IS 16444) QCO के अंतर्गत आते हैं — विद्युत कंपनियाँ केवल BIS-प्रमाणित मीटर ही खरीदती हैं।",
    },
  },
  {
    id: "mcb",
    label: "MCBs & residual-current devices",
    labelHi: "MCB एवं रेसीड्यूअल-करेंट डिवाइस",
    aliases: ["mcb", "rcbo", "rccb", "circuit breaker", "ब्रेकर"],
    category: "electrical",
    standards: ["IS/IEC 60898-1:2002", "IS 12640-1:2016"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "MCBs for household installations (IS/IEC 60898-1) and RCCBs (IS 12640-1) fall under low-voltage switchgear QCOs — ISI certification is mandatory for sale.",
      hi: "घरेलू संस्थान हेतु MCB (IS/IEC 60898-1) व RCCB (IS 12640-1) लो-वोल्टेज स्विचगियर QCO के अंतर्गत आते हैं — विक्रय हेतु ISI प्रमाणन अनिवार्य है।",
    },
  },
  {
    id: "extinguisher",
    label: "Portable fire extinguishers",
    labelHi: "पोर्टेबल अग्निशामक",
    aliases: ["fire", "extinguisher", "अग्निशामक"],
    category: "mechanical",
    standards: ["IS 15683:2018"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "Portable fire extinguishers (IS 15683:2018) are under mandatory certification. The standard specifies discharge time, throw, fire-rating tests and the ISI marking format.",
      hi: "पोर्टेबल अग्निशामक (IS 15683:2018) अनिवार्य प्रमाणन के अंतर्गत हैं। मानक में डिस्चार्ज समय, थ्रो, फायर-रेटिंग परीक्षण व ISI अंकन प्रारूप निर्धारित हैं।",
    },
  },
  {
    id: "plywood",
    label: "Plywood & block boards",
    labelHi: "प्लाईवुड व ब्लॉक बोर्ड",
    aliases: ["plywood", "ply", "block board", "प्लाईवुड"],
    category: "construction",
    standards: ["IS 303:2012", "IS 710:2010", "IS 1659:2004"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "Plywood for general purposes (IS 303), marine plywood (IS 710) and block boards (IS 1659) are under a wood-based QCO — check for the embossed ISI mark on every sheet.",
      hi: "सामान्य प्रयोजन प्लाईवुड (IS 303), मरीन प्लाईवुड (IS 710) व ब्लॉक बोर्ड (IS 1659) वुड-बेस्ड QCO के अंतर्गत हैं — प्रत्येक शीट पर उभरा ISI चिह्न अवश्य देखें।",
    },
  },
  {
    id: "mask",
    label: "Filtering half masks (N95-type respirators)",
    labelHi: "फ़िल्टरिंग हाफ़ मास्क (N95 प्रकार)",
    aliases: ["mask", "n95", "respirator", "मास्क"],
    category: "consumer",
    standards: ["IS 9473:2002"],
    scheme: "voluntary",
    mandatory: false,
    note: {
      en: "Filtering half masks for particle protection are standardized as IS 9473:2002 (classes FFP1/FFP2/FFP3, analogous to N95). Certification is voluntary — prefer ISI-marked masks for assured filtration.",
      hi: "कण-सुरक्षा हेतु फ़िल्टरिंग हाफ़ मास्क IS 9473:2002 (FFP1/FFP2/FFP3 वर्ग, N95 के समतुल्य) में मानकीकृत हैं। प्रमाणन स्वैच्छिक है — सुनिश्चित फ़िल्ट्रेशन हेतु ISI-चिह्नित मास्क चुनें।",
    },
  },
  {
    id: "washing-machines",
    label: "Household washing machines",
    labelHi: "घरेलू वॉशिंग मशीन",
    aliases: ["washing machine", "washer", "top load", "front load", "laundry", "washing machines", "वॉशिंग मशीन"],
    category: "consumer",
    standards: ["IS 302-2-7:2009"],
    scheme: "scheme2",
    mandatory: true,
    note: {
      en: "Household washing machines are covered by CRS against the safety standard IS 302-2-7. Look for the Standard Mark with a valid R-number on the appliance rating plate and the carton before purchase.",
      hi: "घरेलू वॉशिंग मशीनें सुरक्षा मानक IS 302-2-7 के विरुद्ध अनिवार्य पंजीकरण योजना (CRS) के अंतर्गत आती हैं। खरीद से पूर्व उपकरण की रेटिंग प्लेट व डिब्बे पर वैध R-संख्या सहित मानक चिह्न देखें।",
    },
  },
  {
    id: "refrigerators",
    label: "Household refrigerating appliances",
    labelHi: "घरेलू रेफ्रिजरेटर",
    aliases: ["refrigerator", "fridge", "freezer", "frost free", "refrigerators", "रेफ्रिजरेटर", "फ्रिज"],
    category: "consumer",
    standards: ["IS 17550-1:2021"],
    scheme: "scheme2",
    mandatory: true,
    note: {
      en: "Household refrigerators and freezers are registered under CRS against IS 17550-1. Energy performance is separately rated by BEE — the star label is a different scheme from the BIS Standard Mark.",
      hi: "घरेलू रेफ्रिजरेटर व फ्रीज़र IS 17550-1 के विरुद्ध CRS के अंतर्गत पंजीकृत होते हैं। ऊर्जा प्रदर्शन का स्टार लेबल BEE की अलग योजना है, BIS मानक चिह्न से भिन्न।",
    },
  },
  {
    id: "air-conditioners",
    label: "Room air conditioners",
    labelHi: "रूम एयर कंडीशनर",
    aliases: ["air conditioner", "air conditioning", "ac", "split ac", "window ac", "air conditioners", "एयर कंडीशनर", "एसी"],
    category: "consumer",
    standards: ["IS 1391-1:2017", "IS 1391-2:2018"],
    scheme: "scheme2",
    mandatory: true,
    note: {
      en: "Unitary and split room air conditioners are under CRS against IS 1391 (Part 1 and Part 2). The BEE star rating shown on the unit is an energy-performance label and is not a substitute for the BIS registration.",
      hi: "यूनिटरी व स्प्लिट रूम एयर कंडीशनर IS 1391 (भाग 1 व 2) के विरुद्ध CRS के अंतर्गत हैं। यूनिट पर दिखाया BEE स्टार रेटिंग ऊर्जा-प्रदर्शन लेबल है, BIS पंजीकरण का विकल्प नहीं।",
    },
  },
  {
    id: "microwave-ovens",
    label: "Microwave ovens",
    labelHi: "माइक्रोवेव ओवन",
    aliases: ["microwave oven", "microwave", "oven", "convection microwave", "microwave ovens", "माइक्रोवेव"],
    category: "consumer",
    standards: ["IS 302-2-25:2014"],
    scheme: "scheme2",
    mandatory: true,
    note: {
      en: "Microwave ovens, including combination and convection types, are registered under CRS against the safety standard IS 302-2-25. Check the R-number and that the door interlock and leakage limits are declared by the manufacturer.",
      hi: "माइक्रोवेव ओवन (संयोजन व कन्वेक्शन प्रकार सहित) सुरक्षा मानक IS 302-2-25 के विरुद्ध CRS के अंतर्गत पंजीकृत हैं। R-संख्या तथा द्वार इंटरलॉक व रिसाव सीमाओं की घोषणा जाँचें।",
    },
  },
  {
    id: "kitchen-machines",
    label: "Kitchen machines (mixer grinders, food processors)",
    labelHi: "रसोई मशीनें (मिक्सर ग्राइंडर)",
    aliases: ["mixer grinder", "mixer", "grinder", "food processor", "juicer", "kitchen machine", "मिक्सर", "ग्राइंडर"],
    category: "consumer",
    standards: ["IS 302-2-14:2009"],
    scheme: "scheme2",
    mandatory: true,
    note: {
      en: "Mixer grinders, food processors and similar kitchen machines are covered by CRS against IS 302-2-14. The R-number must appear on the appliance and the packaging; the ISI mark alone is not used for CRS products.",
      hi: "मिक्सर ग्राइंडर, फ़ूड प्रोसेसर व समान रसोई मशीनें IS 302-2-14 के विरुद्ध CRS के अंतर्गत आती हैं। उपकरण व पैकेजिंग पर R-संख्या अंकित होनी चाहिए; CRS उत्पादों पर केवल ISI चिह्न नहीं होता।",
    },
  },
  {
    id: "water-heaters",
    label: "Electric storage water heaters (geysers)",
    labelHi: "विद्युत भंडारण जल तापक (गीज़र)",
    aliases: ["geyser", "water heater", "water heaters", "storage heater", "instant heater", "गीज़र", "जल तापक"],
    category: "consumer",
    standards: ["IS 2082:2018"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "Electric storage water heaters are under mandatory ISI certification to IS 2082:2018. The standard covers construction, the thermostat and thermal cut-out, and leakage current — insist on the ISI mark and licence number on the unit.",
      hi: "विद्युत भंडारण जल तापक IS 2082:2018 के अंतर्गत अनिवार्य ISI प्रमाणन में हैं। मानक में संरचना, थर्मोस्टैट, थर्मल कट-आउट व रिसाव धारा निर्धारित है — यूनिट पर ISI चिह्न व लाइसेंस संख्या देखें।",
    },
  },
  {
    id: "vacuum-cleaners",
    label: "Vacuum cleaners",
    labelHi: "वैक्यूम क्लीनर",
    aliases: ["vacuum cleaner", "vacuum cleaners", "vacuum", "robotic vacuum", "canister vacuum", "वैक्यूम क्लीनर"],
    category: "consumer",
    standards: ["IS 302-2-2:2009"],
    scheme: "scheme2",
    mandatory: true,
    note: {
      en: "Vacuum cleaners, including wet-suction and robotic types, are registered under CRS against IS 302-2-2. Verify the R-number on BIS's registration list, because the charger/adaptor may need a separate registration.",
      hi: "वैक्यूम क्लीनर (वेट-सक्शन व रोबोटिक प्रकार सहित) IS 302-2-2 के विरुद्ध CRS के अंतर्गत पंजीकृत हैं। BIS पंजीकरण सूची में R-संख्या जाँचें, क्योंकि चार्जर/अडैप्टर हेतु अलग पंजीकरण आवश्यक हो सकता है।",
    },
  },
  {
    id: "mobile-phones",
    label: "Mobile phones & smartphones",
    labelHi: "मोबाइल फ़ोन",
    aliases: ["mobile phone", "mobile phones", "smartphone", "phone", "handset", "मोबाइल", "फ़ोन"],
    category: "electronics",
    standards: ["IS 13252-1:2010"],
    scheme: "scheme2",
    mandatory: true,
    note: {
      en: "Mobile handsets must be registered under CRS against IS 13252-1 (safety of IT equipment). The R-number is printed on the device, the box and the label; battery and power adaptor are separately notified products.",
      hi: "मोबाइल हैंडसेट IS 13252-1 (आईटी उपकरण की सुरक्षा) के विरुद्ध CRS के अंतर्गत पंजीकृत होने चाहिए। R-संख्या डिवाइस, डिब्बे व लेबल पर छपी होती है; बैटरी व अडैप्टर पृथक अधिसूचित उत्पाद हैं।",
    },
  },
  {
    id: "led-luminaires",
    label: "LED luminaires (panel, downlight, street light)",
    labelHi: "LED ल्यूमिनेयर",
    aliases: ["led luminaire", "led luminaires", "panel light", "downlight", "street light", "luminaire", "एलईडी ल्यूमिनेयर", "पैनल लाइट"],
    category: "electronics",
    standards: ["IS 10322-5-1:2012", "IS 10322-5-2:2019"],
    scheme: "scheme2",
    mandatory: true,
    note: {
      en: "Complete LED luminaires are registered under CRS against the IS 10322 series (Part 5-1 for general requirements, Part 5-2 for recessed luminaires). This is separate from the CRS registration that covers self-ballasted LED lamps.",
      hi: "संपूर्ण LED ल्यूमिनेयर IS 10322 शृंखला (भाग 5-1 सामान्य अपेक्षाएँ, भाग 5-2 रिसेस्ड ल्यूमिनेयर) के विरुद्ध CRS के अंतर्गत पंजीकृत होते हैं। यह सेल्फ-बैलास्टेड LED लैंप के पंजीकरण से अलग है।",
    },
  },
  {
    id: "electric-irons",
    label: "Electric irons",
    labelHi: "विद्युत इस्तरी",
    aliases: ["electric iron", "iron", "dry iron", "steam iron", "electric irons", "इस्तरी", "प्रेस"],
    category: "consumer",
    standards: ["IS 302-2-3:2009"],
    scheme: "scheme2",
    mandatory: true,
    note: {
      en: "Electric dry irons and steam irons are registered under CRS against IS 302-2-3. The standard covers protection against electric shock, temperature rise of the soleplate and mechanical strength of the cord anchorage.",
      hi: "विद्युत ड्राई इस्तरी व स्टीम इस्तरी IS 302-2-3 के विरुद्ध CRS के अंतर्गत पंजीकृत हैं। मानक में विद्युत आघात से सुरक्षा, सोल-प्लेट के तापमान वृद्धि व कॉर्ड एंकरेज की यांत्रिक सामर्थ्य निर्धारित है।",
    },
  },
  {
    id: "grooming-appliances",
    label: "Shavers, hair clippers & grooming appliances",
    labelHi: "शेवर व हेयर क्लिपर",
    aliases: ["shaver", "trimmer", "hair clipper", "grooming", "grooming appliance", "epilator", "ट्रिमर", "शेवर"],
    category: "consumer",
    standards: ["IS 302-2-8:2009"],
    scheme: "scheme2",
    mandatory: true,
    note: {
      en: "Electric shavers, hair clippers and similar personal-grooming appliances are registered under CRS against IS 302-2-8. Wet-use appliances must additionally meet the constructional requirements for use near water.",
      hi: "विद्युत शेवर, हेयर क्लिपर व समान व्यक्तिगत साज-संवार उपकरण IS 302-2-8 के विरुद्ध CRS के अंतर्गत पंजीकृत हैं। जल-उपयोग वाले उपकरणों को पानी के समीप उपयोग हेतु अतिरिक्त संरचनात्मक अपेक्षाएँ पूरी करनी होती हैं।",
    },
  },
  {
    id: "deep-fat-fryers",
    label: "Deep fat fryers, frying pans & similar",
    labelHi: "डीप फ़ैट फ्रायर",
    aliases: ["deep fat fryer", "deep fryer", "fryer", "frying pan", "air fryer", "डीप फ्रायर"],
    category: "consumer",
    standards: ["IS 302-2-13:2009"],
    scheme: "scheme2",
    mandatory: true,
    note: {
      en: "Deep fat fryers, frying pans and similar cooking appliances are registered under CRS against IS 302-2-13, which limits oil temperature, splash resistance and the temperature of accessible handles and knobs.",
      hi: "डीप फ़ैट फ्रायर, फ्राइंग पैन व समान पाक उपकरण IS 302-2-13 के विरुद्ध CRS के अंतर्गत पंजीकृत हैं, जिसमें तेल का तापमान, छींटों से सुरक्षा तथा सुलभ हैंडल व नॉब के तापमान की सीमा निर्धारित है।",
    },
  },
  {
    id: "burnt-clay-bricks",
    label: "Burnt clay building bricks",
    labelHi: "पकाई हुई मिट्टी की ईंट",
    aliases: ["brick", "bricks", "burnt clay brick", "clay brick", "building brick", "common brick", "ईंट"],
    category: "construction",
    standards: ["IS 1077:1992", "IS 3495-1:2019"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "Common burnt clay building bricks are specified by IS 1077 and tested to the IS 3495 series. Buy by compressive strength class, not just by colour — and check water absorption and efflorescence, which decide how the wall will weather.",
      hi: "सामान्य पकाई हुई मिट्टी की ईंट IS 1077 में निर्दिष्ट है तथा IS 3495 शृंखला के अनुसार परीक्षित की जाती है। रंग के स्थान पर संपीड़न सामर्थ्य वर्ग से खरीदें — जल अवशोषण व एफ्लोरेसेंस भी जाँचें।",
    },
  },
  {
    id: "prestressed-concrete",
    label: "Prestressed concrete & prestressing steel",
    labelHi: "पूर्व-प्रतिबलित कंक्रीट",
    aliases: ["prestressed", "prestress", "prestressed concrete", "pre tension", "post tension", "strand", "पूर्व प्रतिबलन"],
    category: "construction",
    standards: ["IS 1343:2012", "IS 6006:2014", "IS 14268:2022"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "Prestressed concrete work follows IS 1343; the steel itself is covered by IS 6006 (stress-relieved strand) and IS 14268 (low-relaxation strand). Low relaxation strand matters on long spans, where relaxation losses reduce the retained prestress.",
      hi: "पूर्व-प्रतिबलित कंक्रीट कार्य IS 1343 के अनुसार होता है; इस्पात हेतु IS 6006 (तनाव-मुक्त स्ट्रैंड) व IS 14268 (न्यून-शिथिलन स्ट्रैंड) लागू हैं। लंबे स्पैन पर न्यून-शिथिलन स्ट्रैंड महत्वपूर्ण है।",
    },
  },
  {
    id: "grey-cast-iron",
    label: "Grey cast iron castings",
    labelHi: "धूसर ढलवाँ लोहा",
    aliases: ["grey cast iron", "gray cast iron", "cast iron", "casting", "castings", "grey iron", "ढलवाँ लोहा"],
    category: "mechanical",
    standards: ["IS 210:2009"],
    scheme: "scheme1",
    mandatory: true,
    note: {
      en: "Grey iron castings are specified by IS 210 with grades such as FG150 and FG200 named by minimum tensile strength. Certification is mandatory; on a drawing, quote the grade and, where it matters, the hardness and the section thickness.",
      hi: "धूसर लोहे की ढलाई IS 210 के अनुसार FG150, FG200 जैसे ग्रेडों में निर्दिष्ट है, जो न्यूनतम तनन सामर्थ्य पर आधारित हैं। प्रमाणन अनिवार्य है; ड्रॉइंग पर ग्रेड व आवश्यकतानुसार कठोरता भी लिखें।",
    },
  },
];

export function matchProducts(queryRaw: string): ProductProfile[] {
  const q = queryRaw.toLowerCase();
  const hits: { p: ProductProfile; score: number }[] = [];
  for (const p of PRODUCTS) {
    let score = 0;
    for (const a of p.aliases) {
      const needle = a.toLowerCase();
      if (!needle) continue;
      if (q.includes(needle)) score += needle.length > 4 ? 3 : 2;
    }
    if (score > 0) hits.push({ p, score });
  }
  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((h) => h.p);
}
