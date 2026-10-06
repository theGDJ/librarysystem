import type { LucideIcon } from "lucide-react";
import { ShieldCheck, Cpu, FileBadge2, Globe2, Gem, Leaf } from "lucide-react";

export type Step = { title: string; desc: string; days?: string };
export type FeeRow = { item: string; amount: string; note?: string };

export type Scheme = {
  id: string;
  tab: string;
  icon: LucideIcon;
  name: string;
  tagline: string;
  legalBasis: string;
  audience: string;
  whenMandatory: string;
  timeline: string;
  validity: string;
  marking: string[];
  steps: Step[];
  fees: FeeRow[];
  documents: string[];
  after: string[];
  pitfalls: string[];
  /** capability id used to deep-link into /labs */
  labCapability: string;
  /** a question the assistant can answer in chat */
  ask: string;
  /** standards search query for the catalogue deep-link */
  standardsQuery: string;
};

export const SCHEMES: Scheme[] = [
  {
    id: "isi",
    tab: "ISI · Scheme-I",
    icon: ShieldCheck,
    name: "ISI Mark — Product Certification (Scheme-I)",
    tagline: "The licence route: factory audit + independent sample testing against an Indian Standard.",
    legalBasis: "BIS Act, 2016 · BIS (Conformity Assessment) Regulations, 2018 · Scheme-I of Schedule I",
    audience:
      "Indian manufacturers of any product with an applicable Indian Standard — cement, TMT steel, cables, helmets, pressure cookers, toys, footwear, packaged water.",
    whenMandatory:
      "Compulsory wherever a Quality Control Order (QCO) notified by a line ministry names the product and its IS code. Voluntary otherwise — but most buyers and government tenders still insist on the ISI mark.",
    timeline: "≈ 30–90 days end-to-end (audit and test report dependent)",
    validity: "1–5 years depending on the product schedule; renewable on performance",
    marking: [
      "ISI Standard Mark with the CM/L- licence number on the product",
      "Licence number must be legible, durable and reproducible on packaging",
      "Marking must stop the moment a licence is suspended or cancelled",
    ],
    steps: [
      { title: "Confirm standard & QCO status", desc: "Identify the exact IS code for the product, the current edition, and whether a QCO makes certification mandatory.", days: "Day 0" },
      { title: "Download the application kit", desc: "Fetch the product schedule, test scheme and fee schedule for that IS code from the BIS portal / branch office.", days: "Day 1–3" },
      { title: "Build factory & QC infrastructure", desc: "Documented process flow, calibrated in-house test equipment (or a tie-up with a recognized lab), trained QC staff, raw-material testing records.", days: "Day 3–20" },
      { title: "File the application", desc: "Submit factory documents, QC plan, process description, test facility list, MSME/Udyam certificate for concessions, and the application fee against the chosen standard.", days: "Day 20–25" },
      { title: "Preliminary scrutiny & clarification", desc: "BIS reviews the application, raises deficiencies and asks for additional documents.", days: "Day 25–35" },
      { title: "Factory audit by BIS officers", desc: "Inspection of raw material storage, process control, testing facilities, calibration, record keeping, packing and marking practice.", days: "Day 35–55" },
      { title: "Independent sample testing", desc: "Sealed samples are drawn and tested against every clause of the standard at BIS or a recognized laboratory; samples may also be drawn from the open market.", days: "Day 45–75" },
      { title: "Grant of licence (CM/L-)", desc: "On conformity, the licence is granted and the ISI Standard Mark with the licence number may be applied to the product.", days: "Day 60–90" },
    ],
    fees: [
      { item: "Application fee", amount: "≈ ₹1,000", note: "per application / per standard (indicative)" },
      { item: "Factory audit charges", amount: "≈ ₹3,000 per man-day", note: "plus travel & stay of BIS officers" },
      { item: "Sample testing", amount: "actuals", note: "charged by BIS or the recognized lab, product-specific" },
      { item: "Licence fee", amount: "≈ ₹1,000", note: "per licence; subsequent years on renewal" },
      { item: "Annual marking fee", amount: "production-linked", note: "as per the marking fee schedule for the product" },
      { item: "MSME concessions", amount: "up to 80% off", note: "micro units & recognized startups ≈80%, small scale ≈50%, additional relief for women & North-East units" },
    ],
    documents: [
      "Proof of premises (rent/lease agreement, GST, Udyam registration)",
      "Manufacturing process flow chart with QC checkpoints",
      "List of manufacturing machinery with capacity",
      "List of in-house test equipment + latest calibration certificates",
      "Tie-up with a BIS-recognized lab for tests not done in-house",
      "Raw material specifications, suppliers and test certificates",
      "Quality control plan and test records format",
      "Product drawing / sample, packing and marking artwork",
      "Factory layout plan",
      "Nomination of a competent person responsible for QC (with qualifications)",
      "MSME/Udyam certificate or startup recognition (for concessions)",
    ],
    after: [
      "Surveillance: periodic factory inspections (usually 1–4 visits a year) plus independent sample drawal.",
      "Samples are also lifted from the market to confirm continued conformity.",
      "Renewal applications must be filed before expiry to avoid a gap in the licence.",
      "Non-conformity can suspend or cancel the licence — marking must stop immediately.",
      "Keep production, testing and traceability records for the retention period in the product schedule.",
    ],
    pitfalls: [
      "Choosing the wrong IS code or an outdated edition — the QCO prescribes a specific edition.",
      "Uncalibrated test equipment is the single most common audit deficiency.",
      "Marking the product before the licence is granted (a punishable offence under the BIS Act).",
      "Ignoring the marking fee returns or not declaring production volumes."
    ],
    labCapability: "mechanical",
    ask: "Walk me through the ISI licence process step by step, including the factory audit.",
    standardsQuery: "ISI",
  },
  {
    id: "crs",
    tab: "CRS · Scheme-II",
    icon: Cpu,
    name: "Compulsory Registration Scheme (CRS / Scheme-II)",
    tagline: "Test a model in a recognized lab, register it online, print the R-number.",
    legalBasis: "Electronics & IT Goods (Requirements for Compulsory Registration) Order, 2012 · Scheme-II of Schedule I",
    audience:
      "Manufacturers and importers of notified electronics and IT goods — laptops, mobile phones, adapters, LEDs, TVs, batteries, set-top boxes, power banks, printers.",
    whenMandatory:
      "Compulsory for every model/brand in the notified list. Manufacture, import, storage and sale of an unregistered model is prohibited.",
    timeline: "≈ 15–30 days after receiving the lab test report",
    validity: "2 years from registration; fresh application before expiry",
    marking: [
      "Standard Mark with the R-XXXXXXXX registration number",
      "Self-declaration of conformity by the brand owner",
      "Number must appear on the product as well as the packaging",
    ],
    steps: [
      { title: "Check the notified list", desc: "Confirm the product category is in the CRS schedule and identify the applicable IS standard (e.g. IS 13252-1, IS 616, IS 16046, IS 16333).", days: "Day 0" },
      { title: "Pick a BIS-recognized lab", desc: "Test one representative model per family at a lab recognized for that standard; the test report is typically valid for 90 days.", days: "Day 1–20" },
      { title: "Register on the CRS portal", desc: "Declare brand, models, factory address, lab details and upload the test report with the registration fee.", days: "Day 20–22" },
      { title: "BIS scrutiny", desc: "BIS verifies the report, brand authorisation and factory details; deficiencies are raised online.", days: "Day 22–30" },
      { title: "Grant of R-number", desc: "Registration is granted and the R-number can be printed on the product and packaging.", days: "Day 25–35" },
      { title: "Renewal", desc: "File for renewal 30 days before expiry with a fresh test report; expired registration blocks imports.", days: "Every 2 years" },
    ],
    fees: [
      { item: "Lab testing", amount: "per model", note: "charged by the recognized lab; varies by product family" },
      { item: "Registration fee", amount: "≈ ₹1,000", note: "per registration application (indicative)" },
      { item: "Renewal fee", amount: "same as registration", note: "plus fresh test report charges" },
      { item: "No factory audit fee", amount: "—", note: "CRS does not involve a factory quality audit up front" },
    ],
    documents: [
      "Test report from a BIS-recognized lab for the applicable IS standard",
      "Brand authorisation letter (for importers / OEM sellers)",
      "Factory details and manufacturing licence of the OEM",
      "Product photographs, model list, ratings and technical datasheet",
      "Undertaking for concurrent models and variants",
      "Airway bill / import documents for models tested abroad",
      "Authorised signatory details and digital signature",
    ],
    after: [
      "Every new model or variant needs its own registration (family testing can cover close variants).",
      "BIS carries out market surveillance and buys samples from shelves; a failed sample cancels the registration.",
      "Registration does not cover a change of brand or factory — a new application is required.",
    ],
    pitfalls: [
      "Using a test report from a lab not recognized for that specific standard.",
      "Registering the model but printing the mark without the R-number.",
      "Letting the registration lapse — customs will hold the consignment.",
      "Assuming the CRS covers accessories; only the notified part of the product is covered.",
    ],
    labCapability: "electronics",
    ask: "My product is an electronic accessory. Do I need CRS registration and how do I apply?",
    standardsQuery: "CRS",
  },
  {
    id: "fmcs",
    tab: "FMCS · Imports",
    icon: Globe2,
    name: "Foreign Manufacturers Certification Scheme (FMCS)",
    tagline: "For overseas factories that need an ISI licence to ship certified goods into India.",
    legalBasis: "BIS Act, 2016 · FMCS as notified under the Conformity Assessment Regulations, 2018",
    audience:
      "Overseas manufacturers exporting QCO or voluntary products to India — steel, toys, electrical goods, chemicals — through an Authorized Indian Representative.",
    whenMandatory:
      "Compulsory for QCO products manufactured outside India. Goods must be certified before import, not merely before sale.",
    timeline: "≈ 90–180 days (includes an overseas audit and sample testing in India)",
    validity: "1–5 years depending on the product schedule",
    marking: [
      "ISI Standard Mark with the CM/L- licence number held against the overseas factory",
      "Consignments must carry the licence number and country of manufacture",
      "Authorized Indian Representative (AIR) undertakes compliance on behalf of the manufacturer",
    ],
    steps: [
      { title: "Appoint an Authorized Indian Representative", desc: "The AIR must be a resident Indian entity that accepts legal responsibility for the licence.", days: "Day 0–10" },
      { title: "File the FMCS application", desc: "Application with factory profile, process documents, QCO standard reference and the prevailing application fee (plus audit costs).", days: "Day 10–25" },
      { title: "Overseas factory audit", desc: "A BIS officer team inspects the manufacturing plant and QC facilities abroad; travel, boarding and stay are borne by the applicant.", days: "Day 60–120" },
      { title: "Sample testing in India", desc: "Sealed samples travel to BIS or recognized labs in India for clause-wise testing against the IS standard.", days: "Day 90–140" },
      { title: "Grant of licence", desc: "Licence granted in the name of the overseas manufacturer; goods may now be marked and shipped.", days: "Day 120–180" },
      { title: "Surveillance", desc: "Annual surveillance audits of the overseas factory plus market sample drawal in India.", days: "Every year" },
    ],
    fees: [
      { item: "Application fee", amount: "per application", note: "higher than the domestic route" },
      { item: "Overseas audit cost", amount: "actual travel + per man-day", note: "flights, visa, stay and BIS inspection charges" },
      { item: "Sample testing", amount: "actuals", note: "tested in India at BIS / recognized labs" },
      { item: "Licence fee + marking fee", amount: "as per schedule", note: "same pattern as Scheme-I" },
      { item: "Bank guarantee", amount: "as notified", note: "may be required for performance security" },
    ],
    documents: [
      "Authorized Indian Representative appointment letter and legal undertaking",
      "Overseas factory registration / incorporation documents",
      "Process flow, list of machinery and QC equipment",
      "Test facility details with calibration certificates",
      "Product specs, drawings, packing and marking artwork",
      "Country-of-origin and export-related certifications",
      "Legal undertaking for conformance and market surveillance cooperation",
    ],
    after: [
      "The licence rests with the overseas premises — shifting production invalidates it.",
      "The AIR must respond to BIS observations and coordinate surveillance audits.",
      "Imported consignments are checked at customs against the licence number.",
    ],
    pitfalls: [
      "Appointing an AIR who is not willing to accept legal responsibility.",
      "Underestimating audit lead times — BIS teams travel in cycles, not on demand.",
      "Ignoring that after 2023 several QCOs also require testing at notified labs in India.",
      "A change in the notified IS edition can invalidate test reports mid-process.",
    ],
    labCapability: "mechanical",
    ask: "I manufacture abroad and want to export to India. Explain the FMCS process and costs.",
    standardsQuery: "quality control order",
  },
  {
    id: "hallmark",
    tab: "Hallmarking",
    icon: Gem,
    name: "Hallmarking of Gold & Silver Jewellery",
    tagline: "Fineness certification at a BIS-recognized AHC with a unique six-digit HUID.",
    legalBasis: "BIS Act, 2016 · Hallmarking of Gold Jewellery and Gold Artefacts Order — mandatory in notified districts",
    audience:
      "Jewellers, retailers, manufacturers and importers of gold jewellery; AHCs are the certification touchpoint.",
    whenMandatory:
      "Sale of gold jewellery in notified districts requires hallmarking. Silver hallmarking is voluntary (IS 2112) though most organised retail now marks it too.",
    timeline: "Jeweller registration ≈ 1 week · same-day hallmarking at an AHC",
    validity: "Jeweller registration is renewable; the hallmark remains valid for the lifetime of the article",
    marking: [
      "BIS Standard Mark (assaying & hallmarking symbol)",
      "Fineness grade / purity in carat & millesimal — 14K585, 18K750, 20K833, 22K916, 24K995 etc.",
      "Six-character HUID applied by laser on every article",
      "AHC mark and year of marking as prescribed",
    ],
    steps: [
      { title: "Register the outlet with BIS", desc: "Online application with KYC, GST and premises details; registration is granted per retail outlet, and passed on to the AHC.", days: "Day 0–7" },
      { title: "Choose an AHC", desc: "Pick a BIS-recognized Assaying & Hallmarking Centre — there are AHCs in most districts now, listed in the labs directory.", days: "Day 1" },
      { title: "Submit articles for assay", desc: "Articles are sorted by purity, weighed and tested by fire assay / XRF by IS 1417 (gold) or IS 2112 (silver).", days: "same day" },
      { title: "Laser marking + HUID", desc: "Conforming articles are laser-marked with the mark, fineness and a unique HUID generated by the BIS portal.", days: "same day" },
      { title: "Rejected articles", desc: "Articles that fail the declared standard are returned unmarked, usually under a declaration of the observed fineness.", days: "same day" },
      { title: "Sell with confidence", desc: "Hallmarked stock can be sold in notified districts; consumers verify the HUID instantly in the BIS Care app.", days: "ongoing" },
    ],
    fees: [
      { item: "Jeweller registration fee", amount: "per outlet", note: "paid online to BIS; renewal applies" },
      { item: "Hallmarking charge per article", amount: "≈ a few tens of rupees", note: "levied by the AHC, varies by AHC and article type" },
      { item: "Wastage on assaying", amount: "negligible for non-destructive testing", note: "XRF is non-destructive; fire assay consumes a small sample" },
      { item: "Consumer HUID verification", amount: "free", note: "via the BIS Care app or the HUID search on the BIS site" },
    ],
    documents: [
      "BIS jeweller registration certificate",
      "GST registration and shop & establishment proof",
      "Stock register and purity declaration",
      "Invoice copies with declared fineness",
      "Hallmarking requisition form for each lot sent to the AHC",
      "KYC of the authorised signatory",
    ],
    after: [
      "Maintain lot-wise records of assaying and hallmarked stock.",
      "Do not mix hallmarked and un-hallmarked stock on the shelf in notified districts.",
      "Rejections should be corrected and resubmitted or sold with correct declared fineness as per the rules.",
      "Selling non-hallmarked gold in notified districts attracts penalties under the BIS Act.",
    ],
    pitfalls: [
      "Declaring a higher fineness than the article actually carries — the most common reason for rejection.",
      "Soldering or repair after hallmarking, which can change the declared purity.",
      "Using a non-recognized AHC — its mark carries no legal weight.",
      "Not displaying the registration certificate at the outlet.",
    ],
    labCapability: "hallmark",
    ask: "How does hallmarking work, what does a HUID contain, and what does it cost?",
    standardsQuery: "hallmark",
  },
  {
    id: "coc",
    tab: "Scheme-IV · CoC",
    icon: FileBadge2,
    name: "Scheme-IV — Certificate of Conformity (CoC)",
    tagline: "Type-approval style conformity for lots, batches and continuous production.",
    legalBasis: "BIS Act, 2016 · Scheme-IV of Schedule I of the Conformity Assessment Regulations, 2018",
    audience:
      "Manufacturers needing certification of a lot, batch or production run rather than an ongoing licence — machinery, equipment, speciality products.",
    whenMandatory:
      "Applied where a regulation or a buyer requires conformity certification of a defined quantity; increasingly used under newer machinery and safety regulations.",
    timeline: "≈ 30–60 days per lot / assessment cycle",
    validity: "Valid for the specific lot or batch covered by the certificate; periodic re-assessment for continuous production",
    marking: [
      "Certificate of Conformity number on the consignment documents",
      "Standard Mark applied only as permitted by the certificate",
      "Lot/batch identification retained for traceability",
    ],
    steps: [
      { title: "Define the lot / scope", desc: "Decide whether certification is for a consignment, a batch or continuous production against the IS standard.", days: "Day 0" },
      { title: "Submit the CoC application", desc: "Application with product details, drawings, technical specifications and the standard invoked.", days: "Day 1–7" },
      { title: "Conformity evaluation", desc: "BIS evaluates conformity through testing, inspection of the manufacturing arrangement, or both.", days: "Day 7–30" },
      { title: "Testing & assessment", desc: "Samples are tested at BIS / recognized labs; production arrangements may be inspected for continuous certification.", days: "Day 15–45" },
      { title: "Issue of CoC", desc: "Certificate issued for the lot/production assessed, with the standard mark permitted for that scope.", days: "Day 30–60" },
      { title: "Re-assessment", desc: "Continuous production requires periodic re-assessment or surveillance as stipulated in the certificate.", days: "as scheduled" },
    ],
    fees: [
      { item: "Application fee", amount: "as notified", note: "per application / per lot" },
      { item: "Testing & inspection", amount: "actuals", note: "product-specific lab charges" },
      { item: "Certificate fee", amount: "as notified", note: "per certificate issued" },
    ],
    documents: [
      "Technical specification / drawing of the product",
      "Bill of materials and component test reports",
      "Manufacturing quality plan",
      "Batch/lot details, serial numbers and quantity",
      "Test reports from BIS / recognized labs",
      "Declaration of conformity signed by the manufacturer",
    ],
    after: [
      "Maintain lot traceability and retain records for the certificate scope.",
      "A new lot needs a fresh application — mark scope cannot be expanded silently.",
      "Watch for regulations that move a product from CoC to full Scheme-I licensing.",
    ],
    pitfalls: [
      "Treating a CoC as a licence — it does not permit unrestricted ongoing marking.",
      "Applying for the wrong IS standard or an obsolete edition.",
      "Selling outside the certified lot without a fresh certificate.",
    ],
    labCapability: "mechanical",
    ask: "When should I use Scheme-IV Certificate of Conformity instead of an ISI licence?",
    standardsQuery: "CoC",
  },
  {
    id: "eco",
    tab: "Voluntary · ECO",
    icon: Leaf,
    name: "Voluntary Certification & ECO Mark",
    tagline: "Optional marks that create market pull where no QCO applies.",
    legalBasis: "BIS Act, 2016 · Voluntary product certification and the ECO Mark scheme for environment-friendly products",
    audience:
      "Manufacturers of products with no QCO but strong market preference for a trusted mark — textiles, food products, packed water, stationery, consumer durables.",
    whenMandatory:
      "Never mandatory by itself; but retailers, e-commerce platforms and tenders increasingly ask for the ISI mark for high-visibility categories.",
    timeline: "≈ 30–90 days, aligned with the Scheme-I route",
    validity: "As per the licence (1–5 years)",
    marking: [
      "ISI Standard Mark with licence number, exactly as under Scheme-I",
      "ECO Mark (with the logo) only where the product qualifies against the ECO criteria",
      "No ECO claims may be made without a valid ECO Mark licence",
    ],
    steps: [
      { title: "Check if a voluntary standard applies", desc: "Many categories have a specification with no QCO — certification remains voluntary but enables premium positioning.", days: "Day 0" },
      { title: "Decide on ECO Mark eligibility", desc: "Review the ECO criteria for the product group — recyclability, hazardous substance limits, energy and water use.", days: "Day 1–5" },
      { title: "Follow the Scheme-I route", desc: "Application, audit, testing and licence grant proceed exactly as in the ISI route.", days: "Day 5–30" },
      { title: "Marking", desc: "Apply the ISI mark (and the ECO Mark where granted) with the licence number.", days: "After grant" },
    ],
    fees: [
      { item: "Fees", amount: "same as Scheme-I", note: "application, audit, testing, licence and marking fees" },
      { item: "MSME concessions", amount: "up to 80% / ~50%", note: "same concession structure applies" },
    ],
    documents: [
      "All Scheme-I documents",
      "ECO criteria compliance data (energy, recyclability, hazardous substances) for ECO Mark",
      "Environmental test reports where the criteria require them",
    ],
    after: [
      "Voluntary licences still attract surveillance and market sample testing.",
      "ECO Mark criteria are revised periodically — check the current schedule before renewal.",
    ],
    pitfalls: [
      "Implying a mandatory requirement to customers — voluntary certification is a trust signal, not a legal one.",
      "Using an expired licence number in marketing material.",
    ],
    labCapability: "consumer",
    ask: "Which products have a voluntary ISI standard, and is the ECO mark worth it?",
    standardsQuery: "ECO",
  },
];

export const COMPARISON: { label: string; values: [string, string, string, string, string] }[] = [
  { label: "Governing scheme", values: ["Scheme-I", "Scheme-II (CRS)", "FMCS", "Hallmarking", "Scheme-IV (CoC)"] },
  { label: "Who applies", values: ["Indian manufacturer", "Manufacturer / importer", "Overseas manufacturer via AIR", "Jeweller / retailer", "Manufacturer for a lot/batch"] },
  { label: "Factory audit", values: ["Yes", "No", "Yes (overseas)", "Premises + AHC recognition", "Only if continuous production"] },
  { label: "Sample testing", values: ["Yes, independent", "Yes, model-wise", "Yes, in India", "Fineness assay at AHC", "Yes, lot-wise"] },
  { label: "Registration/mark", values: ["CM/L- licence", "R- registration", "CM/L- licence", "Hallmark + HUID", "CoC certificate"] },
  { label: "Typical timeline", values: ["30–90 days", "15–30 days", "90–180 days", "1 week / same day", "30–60 days"] },
  { label: "Validity", values: ["1–5 years", "2 years", "1–5 years", "Lifetime of the article", "Lot-specific"] },
  { label: "MSME concessions", values: ["Yes", "Limited", "Not applicable", "No", "No"] },
];

export const READINESS: { id: string; q: string; hint: string; schemes: string[] }[] = [
  { id: "qco", q: "Does a Quality Control Order name your product?", hint: "Search the standard in the catalogue — a QCO chip means certification is compulsory.", schemes: ["isi", "fmcs", "crs"] },
  { id: "electronics", q: "Is it an electronic, IT or electrical good on the CRS list?", hint: "Laptops, mobiles, adapters, LED lamps, batteries, set-top boxes, printers…", schemes: ["crs"] },
  { id: "overseas", q: "Manufactured outside India?", hint: "QCO goods must be certified abroad before they ship.", schemes: ["fmcs"] },
  { id: "jewellery", q: "Gold or silver jewellery?", hint: "Hallmarking is mandatory for gold in notified districts.", schemes: ["hallmark"] },
  { id: "lot", q: "Do you need certification for one lot or batch only?", hint: "Scheme-IV Certificate of Conformity fits project and batch supply.", schemes: ["coc"] },
  { id: "voluntary", q: "No QCO, but buyers ask for a mark?", hint: "Voluntary ISI / ECO marking builds market trust.", schemes: ["isi", "eco"] },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: "How long does an ISI licence really take?",
    a: "Plan for 30–90 days from filing to licence grant. The variable parts are the audit slot (BIS teams inspect in cycles), sample travel and testing. Clean documentation and calibrated test equipment are what keep you at the fast end.",
  },
  {
    q: "Can I start printing the ISI mark before the licence arrives?",
    a: "No. Applying the Standard Mark without a valid licence is a punishable offence under the BIS Act, 2016. Marking may begin only after the licence is granted — and must stop immediately if it is suspended or cancelled.",
  },
  {
    q: "What concessions do MSMEs get?",
    a: "Micro units and recognized startups can receive concessions of up to 80% on certification, testing and marking fees; small-scale units around 50%; women entrepreneurs and units in the North-East get additional relief. Claim them by attaching the Udyam/startup certificate with the application.",
  },
  {
    q: "Do imported electronics need a factory audit in India?",
    a: "No — CRS does not involve an up-front factory audit. The model is tested in a BIS-recognized lab and registered online with an R-number. The brand owner (or its authorised representative) holds the registration and is answerable for surveillance.",
  },
  {
    q: "What happens if a market sample fails?",
    a: "BIS can suspend or cancel the licence, stop production and recall stock. For CRS, the model's registration is cancelled and imports of that model are blocked. Restoring the licence needs corrective action, fresh testing and often an audit.",
  },
  {
    q: "Is the test report from any lab accepted?",
    a: "Only from labs recognized by BIS for that specific Indian Standard. Before testing, confirm the lab appears in the recognized list for your IS code — a report from an unlisted lab wastes both money and the report's short validity window.",
  },
  {
    q: "How do I verify a licence or a HUID as a consumer?",
    a: "Use the BIS Care app or the BIS licence/HUID search with the CM/L- or R- number printed on the product (or the six-character HUID on jewellery). Pramaan's Consumer page also accepts these numbers against its demo registry.",
  },
];

export const INDICATIVE_NOTE =
  "Fees, timelines and concessions are indicative and change with BIS notifications and fee regulations. Confirm the current schedule for your product and IS code before applying.";
