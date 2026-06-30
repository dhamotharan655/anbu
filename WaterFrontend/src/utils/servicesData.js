// CATEGORY_META - Stores metadata, accents, and icons for each main category
export const CATEGORY_META = {
  "Air Conditioner": {
    id: "ac",
    title: "Air Conditioner",
    icon: "❄️",
    accent: "#0A84FF",
    tagline: "Cooling & Climate Control",
    animation: "cooling"
  },
  "RO Water Purifier": {
    id: "ro",
    title: "RO Water Purifier",
    icon: "💧",
    accent: "#00d2ff",
    tagline: "Pure & Safe Drinking Water",
    animation: "water"
  },
  "Refrigerator": {
    id: "refrigerator",
    title: "Refrigerator",
    icon: "🧊",
    accent: "#eb5968",
    tagline: "Preserving Freshness",
    animation: "cooling"
  },
  "Washing Machine": {
    id: "washing_machine",
    title: "Washing Machine",
    icon: "🌀",
    accent: "#7c5cbf",
    tagline: "Laundry Care Solutions",
    animation: "spin"
  },
  "Inverter & Batteries": {
    id: "battery",
    title: "Inverter & Batteries",
    icon: "🔋",
    accent: "#FFD400",
    tagline: "Uninterrupted Power Backup",
    animation: "charging"
  },
  "CCTV Camera": {
    id: "cctv",
    title: "CCTV Camera",
    icon: "📹",
    accent: "#2d9e6b",
    tagline: "24/7 Security & Surveillance",
    animation: "scan"
  },
  "Solar Systems": {
    id: "solar",
    title: "Solar Systems",
    icon: "☀️",
    accent: "#F39C12",
    tagline: "Clean & Renewable Energy",
    animation: "glow"
  }
};

// SERVICES_CATEGORIES - Data for the Services Page and Booking Cart
export const SERVICES_CATEGORIES = [
  {
    ...CATEGORY_META["Air Conditioner"],
    services: [
      { name: "New AC Purchase", time: "2-3 hrs", price: "Call for Quote", desc: "Consultation and sales of premium AC brands." },
      { name: "Installation", time: "1.5 hrs", price: "₹1,500", desc: "Professional mounting and setup of your AC unit." },
      { name: "Removal & Reinstallation", time: "2-3 hrs", price: "₹2,500", desc: "Safe dismantling and re-installation at a new location." },
      { name: "Normal Service", time: "45 mins", price: "₹500", desc: "Basic filter cleaning and performance check." },
      { name: "Jet Pump Water Service", time: "1 hr", price: "₹800", desc: "Deep cleaning of AC coils and blower using high-pressure water." },
      { name: "Complaint", time: "Varies", price: "₹350 Visit", desc: "Diagnostic visit for any AC malfunction." },
      { name: "Stabilizer Installation", time: "30 mins", price: "₹400", desc: "Mounting and connecting a voltage stabilizer." },
      { name: "Outdoor Stand Installation", time: "45 mins", price: "₹600", desc: "Heavy-duty outdoor unit stand fitting." }
    ]
  },
  {
    ...CATEGORY_META["RO Water Purifier"],
    services: [
      { name: "New Domestic RO", time: "1 hr", price: "Call for Quote", desc: "Sales and installation of home water purifiers." },
      { name: "New Commercial RO", time: "4 hrs", price: "Call for Quote", desc: "Large scale RO plant sales for offices and industries." },
      { name: "RO Installation", time: "1 hr", price: "₹500", desc: "Standard installation of a water purifier." },
      { name: "Spun Change", time: "15 mins", price: "₹250", desc: "Replacement of the outer pre-filter." },
      { name: "Complete Filter Change", time: "45 mins", price: "₹2,500", desc: "Replacement of all internal cartridges and membrane." },
      { name: "AMC", time: "1 Year", price: "₹3,500", desc: "Annual Maintenance Contract covering all service visits and filters." },
      { name: "Cleaning", time: "30 mins", price: "₹400", desc: "Deep cleaning of the storage tank and housing." },
      { name: "Complaint", time: "Varies", price: "₹300 Visit", desc: "Diagnostic visit for leaks, pump issues, or low water flow." }
    ]
  },
  {
    ...CATEGORY_META["Refrigerator"],
    services: [
      { name: "New Refrigerator", time: "N/A", price: "Call for Quote", desc: "Sales of top brand refrigerators." },
      { name: "Not Cooling", time: "1-2 hrs", price: "From ₹500", desc: "Diagnostics and repair for lack of cooling." },
      { name: "Over Cooling", time: "1 hr", price: "From ₹400", desc: "Fixing thermostat and sensor issues causing freezing." },
      { name: "Compressor Repair", time: "3-4 hrs", price: "From ₹2,500", desc: "Replacement or repair of the main compressor unit." },
      { name: "Gas Charging", time: "2 hrs", price: "₹1,800", desc: "Leak fixing and complete refrigerant recharge." },
      { name: "Complaint", time: "Varies", price: "₹350 Visit", desc: "General diagnostic visit for strange noises or power issues." }
    ]
  },
  {
    ...CATEGORY_META["Washing Machine"],
    services: [
      { name: "Installation", time: "45 mins", price: "₹500", desc: "Plumbing connections and machine leveling." },
      { name: "Service", time: "1 hr", price: "₹600", desc: "General maintenance and filter cleaning." },
      { name: "Motor Repair", time: "2 hrs", price: "From ₹1,500", desc: "Fixing drum rotation and motor issues." },
      { name: "Drum Cleaning", time: "1.5 hrs", price: "₹800", desc: "Deep descaling and chemical cleaning of the tub." },
      { name: "Complaint", time: "Varies", price: "₹350 Visit", desc: "Diagnostic visit for water leakage, drainage, or power issues." }
    ]
  },
  {
    ...CATEGORY_META["Inverter & Batteries"],
    services: [
      { name: "UPS Installation", time: "1 hr", price: "₹800", desc: "Wiring and setup of home UPS systems." },
      { name: "Battery Installation", time: "30 mins", price: "₹400", desc: "Connecting new tubular or flat plate batteries." },
      { name: "Battery Replacement", time: "45 mins", price: "₹500", desc: "Swapping old batteries with new ones safely." },
      { name: "Distilled Water Filling", time: "30 mins", price: "₹250", desc: "Topping up battery acid levels with pure distilled water." },
      { name: "Charging", time: "1-2 Days", price: "₹400", desc: "Taking dead batteries to the shop for deep charging." },
      { name: "Complaint", time: "Varies", price: "₹350 Visit", desc: "Diagnosing backup time issues or UPS faults." }
    ]
  },
  {
    ...CATEGORY_META["CCTV Camera"],
    services: [
      { name: "Installation", time: "2-4 hrs", price: "₹1,000/Cam", desc: "Wiring, mounting, and DVR setup for new cameras." },
      { name: "Service", time: "1 hr", price: "₹500", desc: "Cleaning lenses and checking cable connections." },
      { name: "Complaint", time: "Varies", price: "₹350 Visit", desc: "Fixing 'No Video' or hard drive recording issues." },
      { name: "Camera Alignment", time: "30 mins", price: "₹300", desc: "Adjusting angles and focus of existing cameras." },
      { name: "Remote Setup", time: "45 mins", price: "₹500", desc: "Configuring mobile app viewing over the internet." }
    ]
  },
  {
    ...CATEGORY_META["Solar Systems"],
    services: [
      { name: "New Installation", time: "1-2 Days", price: "Call for Quote", desc: "Complete off-grid or on-grid solar plant setup." },
      { name: "Maintenance", time: "2 hrs", price: "₹1,000", desc: "Checking wiring, inverters, and battery health." },
      { name: "Cleaning", time: "1-2 hrs", price: "₹800", desc: "Washing solar panels to restore maximum efficiency." },
      { name: "Complaint", time: "Varies", price: "₹500 Visit", desc: "Diagnosing low power generation or inverter errors." },
      { name: "Battery Service", time: "1 hr", price: "₹600", desc: "Specific maintenance for solar tubular battery banks." }
    ]
  }
];

// PRODUCTS_DATA - Data for the Products Page
export const PRODUCTS_DATA = {
  "Air Conditioner": [
    { name: "Split AC", price: "From ₹35,000", desc: "Energy efficient 3-star & 5-star split air conditioners for homes.", features: ["Fast Cooling", "Copper Condenser", "Low Noise"], warranty: "1 Year Comprehensive, 10 Years Compressor" },
    { name: "Window AC", price: "From ₹28,000", desc: "Compact and powerful window AC units for smaller rooms.", features: ["Easy Installation", "Dust Filter", "Economical"], warranty: "1 Year Comprehensive, 5 Years Compressor" },
    { name: "Cassette AC", price: "From ₹65,000", desc: "Ceiling mounted cassette ACs for large commercial spaces and offices.", features: ["360 Degree Airflow", "Space Saving", "Aesthetic Design"], warranty: "1 Year Comprehensive" },
    { name: "AC Stabilizer", price: "From ₹1,800", desc: "Voltage stabilizers to protect your AC from power fluctuations.", features: ["Wide Voltage Range", "Thermal Protection", "Digital Display"], warranty: "3 Years Replacement" },
    { name: "Outdoor Stand", price: "₹1,200", desc: "Heavy duty rust-proof stand for mounting the AC outdoor unit.", features: ["Powder Coated", "Vibration Pads", "Weather Resistant"], warranty: "N/A" },
    { name: "Copper Pipe", price: "₹300/meter", desc: "High quality copper piping for AC gas circulation.", features: ["100% Pure Copper", "Thick Insulation", "Durable"], warranty: "N/A" },
    { name: "Installation Kit", price: "₹2,500", desc: "Complete kit including pipes, wires, and insulation for AC setup.", features: ["All-in-one", "Standard Length", "High Quality"], warranty: "N/A" }
  ],
  "RO Water Purifier": [
    { name: "Domestic RO", price: "From ₹12,000", desc: "7-stage advanced RO purifiers for safe and sweet drinking water at home.", features: ["RO+UV+UF", "Mineral Booster", "TDS Controller"], warranty: "1 Year Complete Warranty" },
    { name: "Commercial RO", price: "From ₹25,000", desc: "High capacity RO plants (25 LPH to 1000 LPH) for offices and restaurants.", features: ["Heavy Duty Pump", "Twin Membranes", "Stainless Steel Frame"], warranty: "1 Year Warranty" },
    { name: "RO Membrane", price: "From ₹1,500", desc: "Heart of the RO system, removes dissolved impurities and heavy metals.", features: ["High Rejection Rate", "Long Life", "Standard Size"], warranty: "N/A" },
    { name: "Spun Filter", price: "₹250", desc: "Pre-filter cartridge to remove sand, dust, and large particles.", features: ["5 Micron Pore Size", "High Dirt Holding", "Easy to change"], warranty: "N/A" },
    { name: "Carbon Filter", price: "₹650", desc: "Activated carbon block to remove chlorine, odor, and organic impurities.", features: ["Coconut Shell Carbon", "High Porosity", "Improves Taste"], warranty: "N/A" },
    { name: "UV Filter", price: "₹850", desc: "Ultraviolet chamber and lamp to deactivate bacteria and viruses.", features: ["Philips UV Lamp", "Stainless Steel Chamber", "11W Power"], warranty: "N/A" },
    { name: "Pump", price: "From ₹1,800", desc: "Booster pump for RO systems to maintain required water pressure.", features: ["100 GPD / 150 GPD", "Low Noise", "Copper Winding"], warranty: "1 Year Replacement" },
    { name: "Accessories", price: "Varies", desc: "Taps, pipes, adaptors, and SV valves for RO purifiers.", features: ["Food Grade Plastic", "Leak Proof", "Standard Fittings"], warranty: "N/A" }
  ],
  "Refrigerator": [
    { name: "Single Door", price: "From ₹15,000", desc: "Direct cool single door refrigerators, ideal for small families.", features: ["Large Vegetable Box", "Toughened Glass", "Stabilizer Free"], warranty: "1 Year Comprehensive, 10 Years Compressor" },
    { name: "Double Door", price: "From ₹25,000", desc: "Frost-free double door fridges with better cooling distribution.", features: ["Convertible Modes", "Digital Inverter", "Deodorizer"], warranty: "1 Year Comprehensive, 10 Years Compressor" },
    { name: "Side By Side", price: "From ₹65,000", desc: "Premium side-by-side refrigerators with huge storage and smart features.", features: ["Water Dispenser", "Twin Cooling", "Smart WiFi"], warranty: "1 Year Comprehensive, 10 Years Compressor" },
    { name: "Compressor", price: "From ₹4,500", desc: "Replacement compressors for various refrigerator models.", features: ["High Efficiency", "Original Spares", "Low Noise"], warranty: "1 Year Warranty" },
    { name: "Accessories", price: "Varies", desc: "Relays, timers, thermostats, and gas charging kits.", features: ["Genuine Parts", "Durable", "Exact Fit"], warranty: "N/A" }
  ],
  "Washing Machine": [
    { name: "Top Load", price: "From ₹16,000", desc: "Fully automatic top loading washing machines for convenient everyday laundry.", features: ["Multiple Wash Programs", "Magic Filter", "Eco Tub Clean"], warranty: "2 Years Comprehensive, 10 Years Motor" },
    { name: "Front Load", price: "From ₹28,000", desc: "Highly efficient front load washing machines for superior wash quality.", features: ["Inbuilt Heater", "Steam Wash", "Fabric Care"], warranty: "2 Years Comprehensive, 10 Years Motor" },
    { name: "Semi Automatic", price: "From ₹10,000", desc: "Cost-effective twin tub semi-automatic washing machines.", features: ["Powerful Pulsator", "Rust Free Body", "Collar Scrubber"], warranty: "2 Years Comprehensive, 5 Years Motor" },
    { name: "Accessories", price: "Varies", desc: "Inlet pipes, drain pipes, covers, and descaling powder.", features: ["High Quality", "Universal Fit", "Protective"], warranty: "N/A" }
  ],
  "Inverter & Batteries": [
    { name: "UPS Battery", price: "From ₹1,200", desc: "Small SMF batteries for computer UPS and small backup devices.", features: ["Maintenance Free", "Spill Proof", "High Discharge"], warranty: "1 Year Warranty" },
    { name: "Car Battery", price: "From ₹3,500", desc: "Reliable starting batteries for hatchbacks, sedans, and SUVs.", features: ["High Cranking Power", "Vibration Resistant", "Long Life"], warranty: "36 to 60 Months Warranty" },
    { name: "Bike Battery", price: "From ₹1,000", desc: "VRLA batteries for motorcycles and scooters.", features: ["Factory Charged", "Zero Maintenance", "Quick Start"], warranty: "48 Months Warranty" },
    { name: "Heavy Vehicle Battery", price: "From ₹8,000", desc: "Heavy-duty batteries for trucks, tractors, and commercial vehicles.", features: ["Rugged Design", "Deep Cycle", "High Capacity"], warranty: "24 to 36 Months Warranty" },
    { name: "Inverter", price: "From ₹5,000", desc: "Pure sine wave home UPS and inverters for seamless power backup.", features: ["Fast Charging", "Overload Protection", "Digital Display"], warranty: "2 Years Warranty" },
    { name: "Home UPS Battery", price: "From ₹12,000", desc: "Tall tubular batteries specifically designed for long power cuts.", features: ["Low Maintenance", "Deep Discharge Recovery", "High Backup"], warranty: "36 to 60 Months Warranty" }
  ],
  "CCTV Camera": [
    { name: "Camera", price: "From ₹1,200", desc: "HD and IP cameras for indoor and outdoor surveillance.", features: ["Night Vision", "Weatherproof", "High Resolution"], warranty: "1-2 Years Warranty" },
    { name: "DVR", price: "From ₹3,500", desc: "Digital Video Recorders (4/8/16 Channel) for analog HD cameras.", features: ["H.265 Compression", "Mobile View", "Motion Detection"], warranty: "1-2 Years Warranty" },
    { name: "NVR", price: "From ₹4,500", desc: "Network Video Recorders for IP camera systems.", features: ["PoE Support", "4K Output", "Smart Search"], warranty: "1-2 Years Warranty" },
    { name: "Hard Disk", price: "From ₹4,000", desc: "Surveillance grade hard drives (1TB to 8TB) for 24/7 recording.", features: ["Continuous Operation", "Low Power", "High Reliability"], warranty: "3 Years Warranty" },
    { name: "SMPS", price: "From ₹500", desc: "Power supply units for multiple CCTV cameras.", features: ["Regulated Output", "Surge Protection", "Cooling Fan"], warranty: "1 Year Warranty" },
    { name: "Cable", price: "From ₹1,200/Bundle", desc: "3+1 coaxial copper cables for clear video transmission.", features: ["90m Bundle", "Low Attenuation", "Weather Resistant"], warranty: "N/A" },
    { name: "Accessories", price: "Varies", desc: "BNC connectors, DC pins, mic, and mounting boxes.", features: ["Quality Connectors", "Secure Fit", "Audio Support"], warranty: "N/A" }
  ],
  "Solar Systems": [
    { name: "Panels", price: "From ₹4,000", desc: "Mono PERC and Polycrystalline solar panels.", features: ["High Efficiency", "Anti-Reflective", "25 Year Performance"], warranty: "10 Years Product, 25 Years Performance" },
    { name: "Inverter", price: "From ₹25,000", desc: "Solar PCU and hybrid inverters with built-in charge controllers.", features: ["MPPT Technology", "Grid Export", "LCD Display"], warranty: "2 to 5 Years Warranty" },
    { name: "Battery", price: "From ₹14,000", desc: "Special solar tubular batteries optimized for daily deep cycling.", features: ["C10 Rating", "Low Antimony", "Long Cycle Life"], warranty: "60 Months Warranty" },
    { name: "Charge Controller", price: "From ₹2,500", desc: "PWM and MPPT solar charge controllers for existing inverters.", features: ["Prevents Overcharging", "Auto Voltage Detection", "Efficiency Boost"], warranty: "1 Year Warranty" },
    { name: "Accessories", price: "Varies", desc: "MC4 connectors, solar DC cables, and mounting structures.", features: ["UV Resistant", "Galvanized Iron", "Secure Connections"], warranty: "N/A" }
  ]
};
