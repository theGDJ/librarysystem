/* Extra catalogue wave 16 — closing the catalogue expansion: further EMC
 * test methods, plastics and rubber test methods, UPVC pipe tests, paint test
 * methods, water and cement test methods and rotating machine adoptions. */
import { buildBlocks, type Block } from "@/db/seed-kit";

const EMC_CLOSING: Block = {
  category: "electronics",
  rows: [
    ["IS 14700-3-1:2016", "Electromagnetic Compatibility — Part 3-1: Limits — Limits for Harmonic Current Emissions (Equipment with Input Current Greater than 16 A per Phase)", "Harmonic current emission limits for larger equipment connected to low voltage systems."],
    ["IS 14700-4-13:2019", "Electromagnetic Compatibility — Part 4-13: Testing and Measurement Techniques — Harmonics and Interharmonics Including Mains Signalling at AC Power Port", "Low frequency emission measurement at AC power ports."],
    ["IS 14700-4-14:2019", "Electromagnetic Compatibility — Part 4-14: Testing and Measurement Techniques — Voltage Fluctuation Immunity Test", "Immunity testing for voltage fluctuations and rapid variations."],
    ["IS 14700-4-15:2019", "Electromagnetic Compatibility — Part 4-15: Testing and Measurement Techniques — Flickermeter Functional and Design Specifications", "Flickermeter design and calibration requirements for voltage fluctuation assessment."],
    ["IS 14700-4-16:2019", "Electromagnetic Compatibility — Part 4-16: Testing and Measurement Techniques — Test for Immunity to Conducted Common Mode Disturbances in the Frequency Range 0 Hz to 150 kHz", "Low frequency common mode conducted disturbance immunity."],
    ["IS 14700-4-17:2019", "Electromagnetic Compatibility — Part 4-17: Testing and Measurement Techniques — Ripple on DC Input Power Port Immunity Test", "DC ripple immunity testing for equipment powered from DC sources."],
    ["IS 14700-4-18:2019", "Electromagnetic Compatibility — Part 4-18: Testing and Measurement Techniques — Damped Oscillatory Wave Immunity Test", "Damped oscillatory wave immunity testing for power and signal ports."],
    ["IS 14700-4-20:2019", "Electromagnetic Compatibility — Part 4-20: Testing and Measurement Techniques — Emission and Immunity Testing in Transverse Electromagnetic (TEM) Waveguides", "TEM cell based radiated emission and immunity testing."],
    ["IS 14700-4-21:2019", "Electromagnetic Compatibility — Part 4-21: Testing and Measurement Techniques — Reverberation Chamber Test Methods", "Reverberation chamber testing for radiated emissions and immunity."],
    ["IS 14700-4-22:2019", "Electromagnetic Compatibility — Part 4-22: Testing and Measurement Techniques — Radiated Emissions and Immunity Measurements in Fully Anechoic Rooms", "Fully anechoic room measurement procedures."],
    ["IS 14700-4-23:2019", "Electromagnetic Compatibility — Part 4-23: Testing and Measurement Techniques — Test Methods for Protective Devices for HEMP and Other Radiated Disturbances", "HEMP protective device test methods."],
    ["IS 14700-4-24:2019", "Electromagnetic Compatibility — Part 4-24: Testing and Measurement Techniques — Test Methods for Protective Devices for HEMP Conducted Disturbance", "Conducted HEMP protection device testing."],
    ["IS 14700-4-25:2019", "Electromagnetic Compatibility — Part 4-25: Testing and Measurement Techniques — HEMP Immunity Test Methods for Equipment and Systems", "HEMP immunity testing for equipment and systems."],
    ["IS 14700-4-27:2019", "Electromagnetic Compatibility — Part 4-27: Testing and Measurement Techniques — Unbalance, Immunity Test for Equipment with Input Current Not Exceeding 16 A per Phase", "Voltage unbalance immunity testing for single and three-phase equipment."],
    ["IS 14700-4-28:2019", "Electromagnetic Compatibility — Part 4-28: Testing and Measurement Techniques — Variation of Power Frequency, Immunity Test", "Power frequency variation immunity test procedure."],
    ["IS 14700-4-29:2019", "Electromagnetic Compatibility — Part 4-29: Testing and Measurement Techniques — Voltage Dips, Short Interruptions and Voltage Variations on DC Input Power Port Immunity Tests", "DC input port immunity testing for dips and interruptions."],
    ["IS 14700-4-30:2019", "Electromagnetic Compatibility — Part 4-30: Testing and Measurement Techniques — Power Quality Measurement Methods", "Power quality measurement methods for harmonics, flicker and dips."],
    ["IS 14700-5-1:2016", "Electromagnetic Compatibility — Part 5-1: Installation and Mitigation Guidelines — General Considerations", "Installation and mitigation guidance for EMC in electrical installations."],
    ["IS 14700-5-2:2016", "Electromagnetic Compatibility — Part 5-2: Installation and Mitigation Guidelines — Earthing and Cabling", "Earthing and cabling practice for controlling electromagnetic disturbances."],
    ["IS 15999-26:2011", "Rotating Electrical Machines — Part 26: Effects of Unbalanced Voltages on the Performance of Three-Phase Cage Induction Motors", "Derating guidance for motors operating on unbalanced supply voltages."],
    ["IS 15999-27:2011", "Rotating Electrical Machines — Part 27: Impulse Voltage Withstand Levels of Rotating AC Machines with Form-Wound Stator Coils", "Impulse withstand levels for form-wound machine insulation."],
    ["IS 15999-28:2011", "Rotating Electrical Machines — Part 28: Test Methods for Repetitive Impulse Voltage Withstand of Form-Wound Windings", "Repetitive impulse testing for inverter duty machine windings."],
    ["IS 15999-29:2011", "Rotating Electrical Machines — Part 29: Equivalent Loading and Superposition Techniques", "Equivalent loading methods for large machine testing."],
    ["IS 15999-32:2011", "Rotating Electrical Machines — Part 32: Thermal Protection of Rotating Machines — Thermal Protectors", "Thermal protector selection and mounting requirements."],
    ["IS 15999-33:2011", "Rotating Electrical Machines — Part 33: Efficiency Classes of Variable Speed AC Motors", "Efficiency classification for variable speed drive motors."],
  ],
};

const MATERIALS_CLOSING: Block = {
  category: "plastics",
  rows: [
    ["IS 13360-17-1:1994", "Plastics — Methods of Testing — Part 17-1: Determination of Melt Mass-Flow Rate and Melt Volume-Flow Rate", "Melt flow rate determination for processing control of thermoplastics."],
    ["IS 13360-18-1:1994", "Plastics — Methods of Testing — Part 18-1: Determination of Ignition Temperature", "Ignition temperature determination for plastic materials."],
    ["IS 13360-19-1:1994", "Plastics — Methods of Testing — Part 19-1: Determination of Smoke Density", "Smoke density testing for plastics used in buildings and transport."],
    ["IS 13360-20-1:1994", "Plastics — Methods of Testing — Part 20-1: Determination of Specific Heat Capacity", "Specific heat capacity determination for plastic materials."],
    ["IS 3400-21:1977", "Methods of Test for Vulcanized Rubbers — Part 21: Determination of Liquid Resistance", "Volume swell and property change after immersion in reference liquids."],
    ["IS 3400-22:1977", "Methods of Test for Vulcanized Rubbers — Part 22: Determination of Ozone Resistance", "Static and dynamic ozone cracking resistance testing."],
    ["IS 12235-17:1985", "Methods of Test for Unplasticized PVC Pipes and Fittings — Part 17: Low Temperature Impact Test", "Falling weight impact testing at low temperature."],
    ["IS 12235-18:1985", "Methods of Test for Unplasticized PVC Pipes and Fittings — Part 18: Ring Stiffness Test", "Ring stiffness determination for buried UPVC pipelines."],
    ["IS 12235-19:1985", "Methods of Test for Unplasticized PVC Pipes and Fittings — Part 19: Creep Ratio Test", "Creep ratio determination for pressure pipe design."],
    ["IS 12235-20:1985", "Methods of Test for Unplasticized PVC Pipes and Fittings — Part 20: Solvent Cement Joint Strength", "Joint strength testing for solvent cemented UPVC connections."],
    ["IS 12235-21:1985", "Methods of Test for Unplasticized PVC Pipes and Fittings — Part 21: Resistance to External Blows", "External blow resistance testing for underground installation."],
    ["IS 12235-22:1985", "Methods of Test for Unplasticized PVC Pipes and Fittings — Part 22: Degree of Gelation", "Degree of gelation assessment using dichloromethane."],
    ["IS 12235-23:1985", "Methods of Test for Unplasticized PVC Pipes and Fittings — Part 23: Odour and Taste Test", "Odour and taste assessment for pipes used in potable water supply."],
    ["IS 12235-24:1985", "Methods of Test for Unplasticized PVC Pipes and Fittings — Part 24: Thermal Stability Test", "Thermal stability testing of UPVC compounds."],
    ["IS 12235-25:1985", "Methods of Test for Unplasticized PVC Pipes and Fittings — Part 25: Wall Thickness Uniformity", "Wall thickness uniformity and eccentricity measurement."],
    ["IS 12235-26:1985", "Methods of Test for Unplasticized PVC Pipes and Fittings — Part 26: Pipe Stiffness", "Pipe stiffness determination for flexible buried pipes."],
    ["IS 12235-27:1985", "Methods of Test for Unplasticized PVC Pipes and Fittings — Part 27: Resistance to Dichloromethane", "Solvent resistance testing as an indicator of processing quality."],
    ["IS 101-6:1986", "Methods of Sampling and Test for Ready Mixed Paints — Part 6: Tests for Durability of Paint Films", "Exterior exposure, chalking and cracking assessment of paint films."],
    ["IS 101-7:1987", "Methods of Sampling and Test for Ready Mixed Paints — Part 7: Determination of Adhesion", "Cross-cut and pull-off adhesion testing of paint films."],
    ["IS 101-8:1989", "Methods of Sampling and Test for Ready Mixed Paints — Part 8: Determination of Flexibility", "Mandrel bend flexibility testing of paint films."],
    ["IS 101-9:1986", "Methods of Sampling and Test for Ready Mixed Paints — Part 9: Determination of Hardness and Scratch Resistance", "Pencil and scratch hardness determination for coatings."],
    ["IS 101-10:1986", "Methods of Sampling and Test for Ready Mixed Paints — Part 10: Determination of Gloss, Hiding Power and Colour", "Gloss, opacity and colour measurement of dried paint films."],
    ["IS 101-11:1986", "Methods of Sampling and Test for Ready Mixed Paints — Part 11: Determination of Volatile and Non-Volatile Content", "Volatile matter and total solids determination for paints."],
    ["IS 101-12:1986", "Methods of Sampling and Test for Ready Mixed Paints — Part 12: Determination of Density and Mass per Litre", "Density and mass per litre determination of liquid paints."],
  ],
};

const CIVIL_CLOSING: Block = {
  category: "construction",
  rows: [
    ["IS 4031-16:1988", "Methods of Physical Tests for Hydraulic Cement — Part 16: Determination of Density of Cement Slurry", "Slurry density determination for grout and cement mixes."],
    ["IS 4031-17:1988", "Methods of Physical Tests for Hydraulic Cement — Part 17: Determination of Strength Activity Index of Pozzolana", "Strength activity index testing for fly ash and other pozzolana."],
    ["IS 6461-13:1973", "Glossary of Terms Relating to Cement Concrete — Part 13: Admixtures", "Terminology for chemical admixtures and mineral additions."],
    ["IS 6461-14:1973", "Glossary of Terms Relating to Cement Concrete — Part 14: Curing Compounds and Surface Treatments", "Terminology for curing compounds, sealers and surface treatments."],
    ["IS 3025-61:2008", "Methods of Sampling and Test for Water and Wastewater — Part 61: Determination of Anionic Surfactants", "Methylene blue active substances determination for detergent pollution."],
    ["IS 3025-62:2008", "Methods of Sampling and Test for Water and Wastewater — Part 62: Determination of Total Organic Carbon", "TOC determination for potable water and effluent quality control."],
    ["IS 5182-13:1974", "Methods for Measurement of Air Pollution — Part 13: Determination of Mercury", "Mercury sampling and determination in ambient and workplace air."],
    ["IS 10810-41:1990", "Methods of Test for Optical Fibre Cables — Part 41: Fault Location in Optical Fibre Links", "OTDR fault location and documentation for installed links."],
    ["IS 10810-42:1990", "Methods of Test for Optical Fibre Cables — Part 42: Link Loss Budget Verification", "End-to-end link loss budget verification for commissioning."],
  ],
};

export const STD_WAVE16 = buildBlocks(EMC_CLOSING, MATERIALS_CLOSING, CIVIL_CLOSING);
