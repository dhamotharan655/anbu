import os
import sys
import django

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from user.models import JobType, Service

SERVICES_DATA = [
    {
        "category": "Air Conditioner",
        "services": [
            { "name": "New AC Purchase", "time": "2-3 hrs", "price": "Call for Quote", "desc": "Consultation and sales of premium AC brands." },
            { "name": "Installation", "time": "1.5 hrs", "price": "₹1,500", "desc": "Professional mounting and setup of your AC unit." },
            { "name": "Removal & Reinstallation", "time": "2-3 hrs", "price": "₹2,500", "desc": "Safe dismantling and re-installation at a new location." },
            { "name": "Normal Service", "time": "45 mins", "price": "₹500", "desc": "Basic filter cleaning and performance check." },
            { "name": "Jet Pump Water Service", "time": "1 hr", "price": "₹800", "desc": "Deep cleaning of AC coils and blower using high-pressure water." },
            { "name": "Complaint", "time": "Varies", "price": "₹350 Visit", "desc": "Diagnostic visit for any AC malfunction." },
            { "name": "Stabilizer Installation", "time": "30 mins", "price": "₹400", "desc": "Mounting and connecting a voltage stabilizer." },
            { "name": "Outdoor Stand Installation", "time": "45 mins", "price": "₹600", "desc": "Heavy-duty outdoor unit stand fitting." }
        ]
    },
    {
        "category": "RO Water Purifier",
        "services": [
            { "name": "New Domestic RO", "time": "1 hr", "price": "Call for Quote", "desc": "Sales and installation of home water purifiers." },
            { "name": "New Commercial RO", "time": "4 hrs", "price": "Call for Quote", "desc": "Large scale RO plant sales for offices and industries." },
            { "name": "RO Installation", "time": "1 hr", "price": "₹500", "desc": "Standard installation of a water purifier." },
            { "name": "Spun Change", "time": "15 mins", "price": "₹250", "desc": "Replacement of the outer pre-filter." },
            { "name": "Complete Filter Change", "time": "45 mins", "price": "₹2,500", "desc": "Replacement of all internal cartridges and membrane." },
            { "name": "AMC", "time": "1 Year", "price": "₹3,500", "desc": "Annual Maintenance Contract covering all service visits and filters." },
            { "name": "Cleaning", "time": "30 mins", "price": "₹400", "desc": "Deep cleaning of the storage tank and housing." },
            { "name": "Complaint", "time": "Varies", "price": "₹300 Visit", "desc": "Diagnostic visit for leaks, pump issues, or low water flow." }
        ]
    },
    {
        "category": "Refrigerator",
        "services": [
            { "name": "New Refrigerator", "time": "N/A", "price": "Call for Quote", "desc": "Sales of top brand refrigerators." },
            { "name": "Not Cooling", "time": "1-2 hrs", "price": "From ₹500", "desc": "Diagnostics and repair for lack of cooling." },
            { "name": "Over Cooling", "time": "1 hr", "price": "From ₹400", "desc": "Fixing thermostat and sensor issues causing freezing." },
            { "name": "Compressor Repair", "time": "3-4 hrs", "price": "From ₹2,500", "desc": "Replacement or repair of the main compressor unit." },
            { "name": "Gas Charging", "time": "2 hrs", "price": "₹1,800", "desc": "Leak fixing and complete refrigerant recharge." },
            { "name": "Complaint", "time": "Varies", "price": "₹350 Visit", "desc": "General diagnostic visit for strange noises or power issues." }
        ]
    },
    {
        "category": "Washing Machine",
        "services": [
            { "name": "Installation", "time": "45 mins", "price": "₹500", "desc": "Plumbing connections and machine leveling." },
            { "name": "Service", "time": "1 hr", "price": "₹600", "desc": "General maintenance and filter cleaning." },
            { "name": "Motor Repair", "time": "2 hrs", "price": "From ₹1,500", "desc": "Fixing drum rotation and motor issues." },
            { "name": "Drum Cleaning", "time": "1.5 hrs", "price": "₹800", "desc": "Deep descaling and chemical cleaning of the tub." },
            { "name": "Complaint", "time": "Varies", "price": "₹350 Visit", "desc": "Diagnostic visit for water leakage, drainage, or power issues." }
        ]
    },
    {
        "category": "Inverter & Batteries",
        "services": [
            { "name": "UPS Installation", "time": "1 hr", "price": "₹800", "desc": "Wiring and setup of home UPS systems." },
            { "name": "Battery Installation", "time": "30 mins", "price": "₹400", "desc": "Connecting new tubular or flat plate batteries." },
            { "name": "Battery Replacement", "time": "45 mins", "price": "₹500", "desc": "Swapping old batteries with new ones safely." },
            { "name": "Distilled Water Filling", "time": "30 mins", "price": "₹250", "desc": "Topping up battery acid levels with pure distilled water." },
            { "name": "Charging", "time": "1-2 Days", "price": "₹400", "desc": "Taking dead batteries to the shop for deep charging." },
            { "name": "Complaint", "time": "Varies", "price": "₹350 Visit", "desc": "Diagnosing backup time issues or UPS faults." }
        ]
    },
    {
        "category": "CCTV Camera",
        "services": [
            { "name": "Installation", "time": "2-4 hrs", "price": "₹1,000/Cam", "desc": "Wiring, mounting, and DVR setup for new cameras." },
            { "name": "Service", "time": "1 hr", "price": "₹500", "desc": "Cleaning lenses and checking cable connections." },
            { "name": "Complaint", "time": "Varies", "price": "₹350 Visit", "desc": "Fixing 'No Video' or hard drive recording issues." },
            { "name": "Camera Alignment", "time": "30 mins", "price": "₹300", "desc": "Adjusting angles and focus of existing cameras." },
            { "name": "Remote Setup", "time": "45 mins", "price": "₹500", "desc": "Configuring mobile app viewing over the internet." }
        ]
    },
    {
        "category": "Solar Systems",
        "services": [
            { "name": "New Installation", "time": "1-2 Days", "price": "Call for Quote", "desc": "Complete off-grid or on-grid solar plant setup." },
            { "name": "Maintenance", "time": "2 hrs", "price": "₹1,000", "desc": "Checking wiring, inverters, and battery health." },
            { "name": "Cleaning", "time": "1-2 hrs", "price": "₹800", "desc": "Washing solar panels to restore maximum efficiency." },
            { "name": "Complaint", "time": "Varies", "price": "₹500 Visit", "desc": "Diagnosing low power generation or inverter errors." },
            { "name": "Battery Service", "time": "1 hr", "price": "₹600", "desc": "Specific maintenance for solar tubular battery banks." }
        ]
    }
]

def seed():
    print("Seeding services...")
    for cat_item in SERVICES_DATA:
        cat_name = cat_item["category"]
        job_type = JobType.objects(name=cat_name).first()
        if not job_type:
            print(f"Creating missing JobType: {cat_name}")
            job_type = JobType(name=cat_name)
            job_type.save()
        
        for svc in cat_item["services"]:
            service = Service.objects(name=svc["name"], job_type=job_type).first()
            if not service:
                print(f"Adding service: {svc['name']} under {cat_name}")
                service = Service(
                    name=svc["name"],
                    price=svc["price"],
                    time=svc["time"],
                    desc=svc["desc"],
                    job_type=job_type
                )
                service.save()
    print("Seeding finished successfully!")

if __name__ == "__main__":
    seed()
