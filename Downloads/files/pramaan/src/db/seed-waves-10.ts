/* Extra catalogue wave 10 — electrical: cables, switchgear, transformers,
 * rotating machines, cells & batteries, solar PV, lighting, appliances,
 * metering and protection. */
import { buildBlocks, type Block } from "@/db/seed-kit";

const CABLES_QCO = "Electrical Wires, Cables (Quality Control) Order";
const SWITCHGEAR_QCO = "Low Voltage Switchgear and Controlgear (Quality Control) Order";
const ACCESSORIES_QCO = "Electrical Accessories (Quality Control) Order";
const APPLIANCE_QCO = "Household Electrical Appliances (Quality Control) Order";
const FAN_QCO = "Electric Ceiling Fans (Quality Control) Order";
const METER_QCO = "Smart Energy Meters (Quality Control) Order";
const SOLAR_QCO = "Solar Photovoltaic Systems (Quality Control) Order";

const CABLES_AND_CONDUCTORS: Block = {
  category: "electrical",
  qco: CABLES_QCO,
  rows: [
    ["IS 1554-2:1988", "PVC Insulated Electric Cables — Part 2: Heavy Duty Cables", "Heavy duty PVC insulated and sheathed cables for working voltages up to 1.1 kV in industrial and outdoor duty.", "M", { editions: 3, keywords: ["pvc cable", "heavy duty cable", "1.1 kv", "केबल"], related: ["IS 1554-1:1988", "IS 694:2010"] }],
    ["IS 9968-1:1988", "Elastomer Insulated Cables — Part 1: Heavy Duty Cables for Working Voltages up to 1.1 kV", "Rubber and elastomer insulated heavy duty cables for damp, hot and mechanically demanding installations."],
    ["IS 9968-2:2002", "Elastomer Insulated Cables — Part 2: Cables for Working Voltages from 3.3 kV up to and Including 33 kV", "Elastomer insulated medium voltage cables with insulation thickness and test requirements by voltage class."],
    ["IS 5831:1984", "PVC Insulation and Sheath of Electric Cables — Specification", "Compound requirements for PVC insulation and sheath used in cables including ageing and temperature tests."],
    ["IS 8713:1998", "Cable Drums for Electric Cables — Specification", "Cable drum sizes, strength and marking requirements for transport and storage of cables."],
    ["IS 10418:1982", "Drums for Electric Cables — Specification", "Wooden and steel cable drum construction requirements for power cables."],
    ["IS 2465:1984", "Code of Practice for Installation of Electric Cables", "Installation, bending radius and support practice for power and control cables."],
    ["IS 11875:1986", "Code of Practice for Fire Protection of Electrical Cables and Cable Galleries", "Fire detection, segregation and suppression measures for cable galleries and tunnels."],
    ["IS 14494:2008", "Copper Wire Rods for Electrical Applications — Specification", "Wire rod quality requirements for drawing copper conductors with conductivity verification.", "M"],
    ["IS 5819:1989", "Specification for Aluminium Conductors for Overhead Lines", "Aluminium strand and conductor requirements for overhead distribution lines."],
    ["IS 398-1:1996", "Aluminium Conductors for Overhead Transmission Purposes — Part 1: Aluminium Stranded Conductors", "AAC conductor construction and strength requirements for transmission lines."],
    ["IS 398-2:1996", "Aluminium Conductors for Overhead Transmission Purposes — Part 2: Aluminium Conductor Steel Reinforced", "ACSR conductor composition, strength and current rating requirements."],
    ["IS 398-3:1996", "Aluminium Conductors for Overhead Transmission Purposes — Part 3: Aluminium Conductor Alloy Reinforced", "ACAR conductor specification for improved strength on transmission routes."],
    ["IS 398-4:1994", "Aluminium Conductors for Overhead Transmission Purposes — Part 4: Aluminium Alloy Stranded Conductors", "Alloy conductor requirements for distribution networks with tighter strength limits."],
    ["IS 14255:1995", "Aerial Bunched Cables for Overhead Power Distribution", "Aerial bunched insulated cables for low voltage distribution in congested or theft-prone areas."],
    ["IS 15636:2010", "Power Cables for Rated Voltages of 3.3 kV, 6.6 kV, 11 kV and 33 kV — Specification", "Medium voltage power cable construction, insulation levels and type test requirements."],
    ["IS 8674:1987", "Laying of Electric Cables — Code of Practice", "Cable trenching, ducting, backfilling and protection practice for buried cables."],
    ["IS 3006-1:1996", "PVC Insulated Cables for Automotive Purposes — Specification", "Cables for automotive wiring with temperature, flame and abrasion performance requirements."],
    ["IS 14933:2001", "Guidelines for Selection of Cables by Thermal and Voltage Drop Criteria", "Cable sizing guidance based on current rating, grouping, ambient temperature and voltage drop."],
    ["IS 13947-1:1993", "Specification for High Voltage Switchgear and Controlgear", "High voltage switchgear construction, ratings and testing requirements."],
  ],
};

const SWITCHGEAR_AND_PROTECTION: Block = {
  category: "electrical",
  qco: SWITCHGEAR_QCO,
  rows: [
    ["IS/IEC 60947-1:2014", "Low-Voltage Switchgear and Controlgear — Part 1: General Rules", "Common rules for low-voltage switchgear and controlgear covering ratings, clearances and tests.", "Q:Low Voltage Switchgear and Controlgear (Quality Control) Order"],
    ["IS/IEC 60947-4-2:2018", "Low-Voltage Switchgear and Controlgear — Part 4-2: Contactors and Motor-Starters — AC Semiconductor Motor Controllers and Starters", "Requirements for semiconductor motor controllers and soft starters."],
    ["IS/IEC 60947-5-1:2017", "Low-Voltage Switchgear and Controlgear — Part 5-1: Control Circuit Devices and Switching Elements — Electromechanical Control Circuit Devices", "Push buttons, indicators and control switches for control circuits."],
    ["IS/IEC 60898-2:2003", "Electrical Accessories — Circuit-Breakers for Overcurrent Protection for Household and Similar Installations — Part 2: Circuit-Breakers for AC and DC Operation", "MCB requirements for combined AC and DC duty including DC breaking tests."],
    ["IS 8828:2019", "Electrical Accessories — Circuit Breakers for Overcurrent Protection for Household and Similar Installations", "Miniature circuit breaker ratings, tripping characteristics and breaking capacity tests.", "M", { keywords: ["mcb", "circuit breaker", "miniature circuit breaker", "एमसीबी"], related: ["IS 12640-1:2016"] }],
    ["IS 12640-2:2016", "Residual Current Operated Circuit-Breakers (RCCBs) for Household and Similar Uses — Part 2: RCCBs Without Integral Overcurrent Protection", "RCCB sensitivity classes, trip times and test requirements for earth leakage protection."],
    ["IS 3069:2019", "General Requirements for Switchgear and Controlgear for Voltages Not Exceeding 1000 V", "Constructional and performance requirements common to LV switchgear assemblies."],
    ["IS 12021:2001", "Degree of Protection Provided by Enclosures for Electrical Equipment", "IP code classification and verification tests for enclosures."],
    ["IS 3427:1997", "Alternating Current Electricity Meters — Specification", "Accuracy classes, starting current and loading tests for AC energy meters.", "Q:Energy Meters (Quality Control) Order"],
    ["IS 13779:2022", "AC Static Watt-Hour Meters, Class 1 and 2 — Specification", "Static energy meter accuracy, tamper detection and communication requirements.", "Q:Energy Meters (Quality Control) Order"],
    ["IS 16444-2:2017", "AC Static Direct Connected Watt-Hour Smart Meters — Part 2: Specification", "Smart meter metrology, communication module and net metering requirements.", "Q:Smart Energy Meters (Quality Control) Order"],
    ["IS 15884:2010", "Alternating Current Direct Connected Static Prepayment Meters — Specification", "Prepaid meter tariff handling, display and tamper event requirements."],
    ["IS 12534:1988", "Code of Practice for Earthing of Power Supply Installations", "Earthing system design for substations and power installations."],
    ["IS/IEC 62305-1:2012", "Protection Against Lightning — Part 1: General Principles", "Lightning protection design principles covering risk assessment and protection levels."],
    ["IS/IEC 62305-2:2012", "Protection Against Lightning — Part 2: Risk Management", "Risk assessment methodology for determining lightning protection needs."],
    ["IS 2309:1989", "Code of Practice for Protection of Buildings and Allied Structures Against Lightning", "Air termination, down conductor and earth termination design for buildings."],
    ["IS 2607:1966", "Specification for Lightning Arresters for Alternating Current Systems", "Surge arrester classes and voltage rating requirements for AC systems."],
    ["IS 10118-1:1982", "Code of Practice for Selection, Installation and Maintenance of Switchgear and Controlgear — Part 1: General", "Selection and maintenance practice for LV switchgear installations."],
    ["IS 10118-4:1982", "Code of Practice for Selection, Installation and Maintenance of Switchgear and Controlgear — Part 4: Air-Break Switches and Fuses", "Selection and installation practice for air-break switches, isolators and fuses."],
    ["IS 5561:1979", "Specification for Time Delay Relays", "Time delay relay classes, setting ranges and test requirements."],
    ["IS 9675:1980", "Specification for Alternating Current Contactors", "AC contactor ratings, utilisation categories and endurance requirements."],
    ["IS 13947-3:1993", "Specification for High Voltage Switchgear and Controlgear — Part 3: Switches and Isolators", "HV isolator and switch requirements including making and breaking capacity."],
    ["IS 3156:1992", "Voltage Transformers — Specification", "Inductive voltage transformer accuracy classes, burdens and dielectric tests."],
    ["IS 2705-1:1992", "Current Transformers — Specification — Part 1: General Requirements", "Current transformer ratios, accuracy classes and insulation requirements for metering and protection."],
    ["IS 2705-2:1992", "Current Transformers — Specification — Part 2: Measuring Current Transformers", "Measurement class CT accuracy limits and rated burdens."],
    ["IS 2705-3:1994", "Current Transformers — Specification — Part 3: Protective Current Transformers", "Protection class CT requirements including composite error and knee point voltage."],
    ["IS 5541:2018", "Guide for Testing of Electrical Insulating Materials", "Test methods for dielectric strength, resistivity and thermal endurance of insulating materials."],
    ["IS 13703:1993", "Code of Practice for Selection, Installation and Maintenance of Transformers", "Transformer selection, protection and maintenance guidance for industrial installations."],
  ],
};

const TRANSFORMERS_AND_MACHINES: Block = {
  category: "electrical",
  qco: SWITCHGEAR_QCO,
  rows: [
    ["IS 1180-2:2014", "Outdoor Type Oil Immersed Distribution Transformers Up to and Including 2500 kVA — Part 2: Dry Type Transformers", "Dry type distribution transformer requirements including temperature rise and insulation class."],
    ["IS 2026-4:2018", "Power Transformers — Part 4: Guide to the Lightning and Switching Impulse Testing of Power Transformers", "Impulse test procedures for power transformers."],
    ["IS 2026-5:2018", "Power Transformers — Part 5: Ability to Withstand Short Circuit", "Short circuit withstand requirements for transformer windings."],
    ["IS 13976:1994", "Power Transformers — Application Guide", "Application guidance for selecting power transformers by load, voltage class and cooling."],
    ["IS 4691:1985", "Specification for Three-Phase Induction Motors", "Three-phase induction motor ratings, performance and temperature rise limits.", "Q:Electrical Equipment (Quality Control) Order"],
    ["IS 8789:1996", "Three-Phase Squirrel Cage Induction Motors — Specification", "Squirrel cage motor efficiency, starting torque and frame designation requirements.", "Q:Electrical Equipment (Quality Control) Order"],
    ["IS 1231:1973", "Dimensions of Three-Phase Foot-Mounted Induction Motors", "Frame dimensions and mounting arrangement for foot mounted induction motors."],
    ["IS 2223:1983", "Dimensions of Flange Mounted Motors", "Flange dimensions and mounting tolerances for industrial motors."],
    ["IS 4722:2018", "Rotating Electrical Machines — Specification", "General requirements for rotating machines covering rating, duty and performance."],
    ["IS 7130:2020", "Single Phase Induction Motors — Specification", "Single phase motor performance and construction requirements for domestic and industrial duty."],
    ["IS 15999-1:2011", "Rotating Electrical Machines — Part 1: Rating and Performance", "Rating, duty and performance classes aligned with IEC 60034-1 for machines.", "Q:Electrical Equipment (Quality Control) Order"],
    ["IS 15999-2-1:2011", "Rotating Electrical Machines — Part 2-1: Standard Methods for Determining Losses and Efficiency from Tests", "Efficiency determination methods for rotating electrical machines."],
    ["IS 12824:1989", "Guide for Testing of Three-Phase Induction Motors", "Type test and routine test schedule for induction motors."],
  ],
};

const SOLAR_AND_STORAGE: Block = {
  category: "electrical",
  qco: SOLAR_QCO,
  rows: [
    ["IS/IEC 61215-1:2021", "Terrestrial Photovoltaic (PV) Modules — Design Qualification and Type Approval — Part 1: Test Requirements", "Generic design qualification test requirements for PV modules.", "Q:Solar Photovoltaic Systems (Quality Control) Order"],
    ["IS 16221-3:2016", "Solar Photovoltaic — Charge Controllers — Part 3: Specification", "Charge controller performance and protection requirements for solar home systems."],
    ["IS 16221-4:2016", "Solar Photovoltaic — Inverters for Solar Photovoltaic Systems — Part 4: Specification", "Solar inverter efficiency, islanding and protection requirements.", "Q:Solar Photovoltaic Systems (Quality Control) Order"],
    ["IS 14700-1:2016", "Solar Photovoltaic Water Pumping Systems — Part 1: Centrifugal Pumps — Specification", "Solar pump and controller specification for agricultural water pumping.", "Q:Solar Photovoltaic Systems (Quality Control) Order"],
    ["IS 14700-2:2016", "Solar Photovoltaic Water Pumping Systems — Part 2: Submersible Pumps — Specification", "Submersible solar pump motor, controller and protection requirements."],
    ["IS 16928:2018", "Solar Photovoltaic Street Light Controllers — Specification", "Charge and load controller requirements for solar street lighting systems."],
    ["IS 16789:2018", "Solar Photovoltaic Modules — Degradation Testing", "Accelerated degradation test procedures for module reliability evaluation."],
    ["IS 16270:2016", "Secondary Cells and Batteries for Solar Photovoltaic Application — General Requirements and Methods of Test", "Test requirements for solar secondary cells including capacity and cycle life."],
    ["IS 16893-1:2018", "Secondary Lithium Cells and Batteries for Portable Applications — Part 1: General Requirements and Test Methods", "Lithium cell electrical, temperature and safety test requirements for portable products."],
    ["IS 16893-2:2018", "Secondary Lithium Cells and Batteries for Portable Applications — Part 2: Safety Testing", "Lithium battery safety tests including abuse, overcharge and short circuit."],
    ["IS 16046-1:2018", "Secondary Cells and Batteries Containing Alkaline or Other Non-Acid Electrolytes — Safety Requirements for Portable Sealed Secondary Cells", "Portable sealed alkaline and lithium battery safety requirements for CRS registration.", "C"],
    ["IS 16550:2016", "Sealed Secondary Cells and Batteries Containing Alkaline Electrolytes for Use in Electric Vehicles — Safety Requirements", "EV battery safety requirements including vibration, thermal shock and protection circuits."],
    ["IS 17017-1:2018", "Electric Vehicle Conductive Charging System — Part 1: General Requirements", "General requirements for EV conductive charging including connector safety and communication.", "Q:Electric Vehicles Charging Systems (Quality Control) Order"],
    ["IS 17017-2:2018", "Electric Vehicle Conductive Charging System — Part 2: Plugs, Socket-Outlets, Vehicle Connectors and Vehicle Inlets", "Connector and inlet requirements for AC EV charging.", "Q:Electric Vehicles Charging Systems (Quality Control) Order"],
    ["IS 17017-21:2019", "Electric Vehicle Conductive Charging System — Part 21: Requirements for Electric Vehicle Charging Stations", "EVSE construction, insulation and safety requirements for charging stations."],
    ["IS 17017-25:2019", "Electric Vehicle Conductive Charging System — Part 25: EMC Requirements", "EMC requirements for EV supply equipment including immunity and emissions."],
    ["IS 17017-22:2018", "Electric Vehicle Conductive Charging System — Part 22: AC Electric Vehicle Charging Station", "AC charging station requirements including pilot function and protection."],
  ],
};

const LIGHTING_AND_APPLIANCES: Block = {
  category: "electrical",
  qco: APPLIANCE_QCO,
  rows: [
    ["IS 10322-1:2012", "Luminaires — Part 1: General Requirements and Tests", "General safety requirements for luminaires including construction, wiring and thermal tests."],
    ["IS 10322-2-2:2009", "Luminaires — Part 2-2: Particular Requirements for Recessed Luminaires", "Recessed luminaire safety requirements particularly for thermal protection.", "C"],
    ["IS 10322-5-3:2012", "Luminaires — Part 5-3: Particular Requirements for Luminaires for Emergency Lighting", "Emergency luminaire performance and autonomy requirements."],
    ["IS 16102-3:2012", "Self-Ballasted LED Lamps for General Lighting Services — Part 3: Performance Requirements", "LED lamp efficacy, colour rendering and life requirements.", "Q:Electrical Equipment (Quality Control) Order"],
    ["IS 16103-1:2012", "LED Luminaires — Part 1: General Requirements and Tests", "General safety and performance requirements for LED luminaires."],
    ["IS 16106:2012", "Method of Measurement of Luminous Flux of LED Lamps", "Goniophotometric measurement of LED lamp luminous flux and efficiency."],
    ["IS 16107:2012", "Photobiological Safety of Lamps and Lamp Systems", "Blue light hazard and photobiological risk group classification for lamps."],
    ["IS 13386:2001", "Tubular Fluorescent Lamps for General Lighting Service — Specification", "Fluorescent lamp dimensions, electrical characteristics and photometric performance.", "Q:Electrical Equipment (Quality Control) Order"],
    ["IS 2215:1999", "Specification for Ballasts for Tubular Fluorescent Lamps", "Magnetic and electronic ballast electrical and thermal requirements."],
    ["IS 1534:1977", "Specification for Lighting Fittings for Street Lighting", "Street lighting luminaire construction and photometric requirements."],
    ["IS 1913:1980", "Specification for General Lighting Service Tungsten Filament Lamps", "Incandescent lamp ratings, caps and photometric tolerances."],
    ["IS 418:2004", "Tungsten Filament General Service Electric Lamps — Specification", "Filament lamp dimensional and performance requirements for general lighting."],
    ["IS 302-2-201:2009", "Household and Similar Electrical Appliances — Safety — Part 2-201: Particular Requirements for Electric Irons", "Safety requirements for dry and steam irons including temperature and leakage limits."],
    ["IS 302-2-24:2009", "Household and Similar Electrical Appliances — Safety — Part 2-24: Particular Requirements for Refrigerators", "Safety requirements for domestic refrigerators and freezers."],
    ["IS 302-2-11:2009", "Household and Similar Electrical Appliances — Safety — Part 2-11: Particular Requirements for Tumble Dryers", "Tumble dryer safety requirements including heating and protection against moisture."],
    ["IS 302-2-40:2009", "Household and Similar Electrical Appliances — Safety — Part 2-40: Particular Requirements for Electrical Heat Pumps, Air-Conditioners and Dehumidifiers", "Safety requirements for air-conditioners and heat pumps including refrigerant hazards."],
    ["IS 7872:2018", "Water Coolers — Specification", "Water cooler cooling capacity, temperature control and hygiene requirements."],
    ["IS 2996:1981", "Specification for Air Circulator Fans", "Air circulator fan airflow, power consumption and construction requirements."],
    ["IS 15648:2006", "Electric Ceiling Fans — Specification", "Ceiling fan sweep, air delivery, service value and safety requirements.", "Q:Electric Ceiling Fans (Quality Control) Order"],
    ["IS 14703:1999", "Energy Efficiency Ratio of Ceiling Fans — Determination", "Test method for measuring ceiling fan air delivery and input power."],
  ],
};

export const STD_WAVE10 = buildBlocks(
  CABLES_AND_CONDUCTORS,
  SWITCHGEAR_AND_PROTECTION,
  TRANSFORMERS_AND_MACHINES,
  SOLAR_AND_STORAGE,
  LIGHTING_AND_APPLIANCES,
);
