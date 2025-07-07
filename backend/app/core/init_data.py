"""Initialize demo data for development"""
from ..models.user import User
from ..models.organization import Organization
from ..models.entity import Entity, EntityType
from ..core.security import get_password_hash


async def create_demo_data():
    """Create demo user and organization for testing"""
    
    # Check if demo data already exists
    demo_user = await User.find_one(User.email == "demo@example.com")
    if demo_user:
        print("Demo data already exists, skipping initialization")
        return
    
    print("Creating demo data...")
    
    # Create demo organization
    demo_org = Organization(
        name="Demo Organization",
        subscription_tier="enterprise",
        max_documents_per_month=1000,
        billing_email="billing@demo.com"
    )
    await demo_org.insert()
    print(f"Created demo organization: {demo_org.name}")
    
    # Create demo user
    demo_user = User(
        email="demo@example.com",
        full_name="Demo User",
        hashed_password=get_password_hash("demo123"),
        organization_id=str(demo_org.id),
        is_active=True,
        is_superuser=False
    )
    await demo_user.insert()
    print(f"Created demo user: {demo_user.email}")
    
    # Create demo entities
    entities_data = [
        {
            "name": "Default",
            "description": "Default entity for document organization",
            "entity_type": EntityType.CUSTOM
        },
        {
            "name": "Main Office",
            "description": "Primary office location",
            "entity_type": EntityType.LOCATION,
            "metadata": {
                "address": "123 Main St, Anytown, USA",
                "square_feet": 50000
            }
        },
        {
            "name": "2024 Policy Year",
            "description": "Documents for 2024 policy year",
            "entity_type": EntityType.POLICY_YEAR,
            "metadata": {
                "year": 2024,
                "effective_date": "2024-01-01"
            }
        },
        {
            "name": "ACME Client",
            "description": "ACME Corporation client files",
            "entity_type": EntityType.CLIENT,
            "metadata": {
                "industry": "Manufacturing",
                "revenue": 50000000
            }
        }
    ]
    
    for entity_data in entities_data:
        entity = Entity(
            name=entity_data["name"],
            description=entity_data["description"],
            organization_id=str(demo_org.id),
            entity_type=entity_data["entity_type"],
            metadata=entity_data.get("metadata", {})
        )
        await entity.insert()
        print(f"Created demo entity: {entity.name} ({entity.entity_type})")
    
    print("Demo data creation completed!")
    print("\nDemo Login Credentials:")
    print("Email: demo@example.com")
    print("Password: demo123")
    print("\nOrganization: Demo Organization")
    print(f"Organization ID: {demo_org.id}")
    print(f"User ID: {demo_user.id}")


async def reset_demo_data():
    """Reset demo data - use with caution!"""
    print("Resetting demo data...")
    
    # Find demo user and organization
    demo_user = await User.find_one(User.email == "demo@example.com")
    if demo_user:
        # Delete all entities for this organization
        await Entity.find(Entity.organization_id == demo_user.organization_id).delete()
        
        # Delete user
        await demo_user.delete()
        
        # Delete organization
        demo_org = await Organization.get(demo_user.organization_id)
        if demo_org:
            await demo_org.delete()
        
        print("Demo data reset completed!")
    else:
        print("No demo data found to reset.")