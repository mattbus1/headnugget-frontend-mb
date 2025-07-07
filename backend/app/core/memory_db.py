"""
In-memory database for development and testing
Allows backend to run without MongoDB for immediate testing
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid
from ..models.user import User as UserModel, UserResponse
from ..models.organization import Organization as OrgModel
from ..models.entity import Entity as EntityModel, EntityType
from ..models.document import DocumentModel, DocumentStatus
from ..core.security import get_password_hash


class MemoryDB:
    def __init__(self):
        self.users: Dict[str, Dict] = {}
        self.organizations: Dict[str, Dict] = {}
        self.entities: Dict[str, Dict] = {}
        self.documents: Dict[str, Dict] = {}
        self.init_demo_data()
    
    def init_demo_data(self):
        """Initialize demo data"""
        # Create demo organization
        org_id = str(uuid.uuid4())
        self.organizations[org_id] = {
            "id": org_id,
            "name": "Demo Organization",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True,
            "subscription_tier": "enterprise",
            "max_documents_per_month": 1000,
            "documents_processed_this_month": 0,
            "billing_email": "billing@demo.com"
        }
        
        # Create demo user
        user_id = str(uuid.uuid4())
        self.users[user_id] = {
            "id": user_id,
            "email": "demo@example.com",
            "full_name": "Demo User",
            "hashed_password": get_password_hash("demo123"),
            "organization_id": org_id,
            "is_active": True,
            "is_superuser": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Create demo entities
        entities_data = [
            {
                "name": "Default",
                "description": "Default entity for document organization",
                "entity_type": EntityType.CUSTOM,
                "metadata": {}
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
            entity_id = str(uuid.uuid4())
            self.entities[entity_id] = {
                "id": entity_id,
                "name": entity_data["name"],
                "description": entity_data["description"],
                "organization_id": org_id,
                "entity_type": entity_data["entity_type"],
                "metadata": entity_data["metadata"],
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "document_count": 0,
                "last_document_uploaded": None
            }
    
    # User methods
    async def find_user_by_email(self, email: str) -> Optional[Dict]:
        for user in self.users.values():
            if user["email"] == email:
                return user
        return None
    
    async def create_user(self, user_data: Dict) -> Dict:
        user_id = str(uuid.uuid4())
        user_data["id"] = user_id
        user_data["created_at"] = datetime.utcnow()
        user_data["updated_at"] = datetime.utcnow()
        self.users[user_id] = user_data
        return user_data
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        return self.users.get(user_id)
    
    # Organization methods
    async def create_organization(self, org_data: Dict) -> Dict:
        org_id = str(uuid.uuid4())
        org_data["id"] = org_id
        org_data["created_at"] = datetime.utcnow()
        org_data["updated_at"] = datetime.utcnow()
        org_data["is_active"] = True
        org_data["subscription_tier"] = "enterprise"
        org_data["max_documents_per_month"] = 1000
        org_data["documents_processed_this_month"] = 0
        self.organizations[org_id] = org_data
        return org_data
    
    # Entity methods
    async def create_entity(self, entity_data: Dict) -> Dict:
        entity_id = str(uuid.uuid4())
        entity_data["id"] = entity_id
        entity_data["created_at"] = datetime.utcnow()
        entity_data["updated_at"] = datetime.utcnow()
        entity_data["is_active"] = True
        entity_data["document_count"] = 0
        entity_data["last_document_uploaded"] = None
        self.entities[entity_id] = entity_data
        return entity_data
    
    async def get_entities_by_org(self, org_id: str, entity_type: Optional[str] = None, include_inactive: bool = False) -> List[Dict]:
        entities = []
        for entity in self.entities.values():
            if entity["organization_id"] == org_id:
                if not include_inactive and not entity["is_active"]:
                    continue
                if entity_type and entity["entity_type"] != entity_type:
                    continue
                entities.append(entity)
        return sorted(entities, key=lambda x: x["name"])
    
    async def get_entity_by_id(self, entity_id: str) -> Optional[Dict]:
        return self.entities.get(entity_id)
    
    async def update_entity(self, entity_id: str, update_data: Dict) -> Optional[Dict]:
        if entity_id in self.entities:
            self.entities[entity_id].update(update_data)
            self.entities[entity_id]["updated_at"] = datetime.utcnow()
            return self.entities[entity_id]
        return None
    
    async def delete_entity(self, entity_id: str) -> bool:
        if entity_id in self.entities:
            if self.entities[entity_id]["document_count"] > 0:
                # Soft delete
                self.entities[entity_id]["is_active"] = False
                self.entities[entity_id]["updated_at"] = datetime.utcnow()
            else:
                # Hard delete
                del self.entities[entity_id]
            return True
        return False
    
    # Document methods
    async def create_document(self, doc_data: Dict) -> Dict:
        doc_id = str(uuid.uuid4())
        doc_data["id"] = doc_id
        doc_data["created_at"] = datetime.utcnow()
        # Only set status to PENDING if not already specified
        if "status" not in doc_data:
            doc_data["status"] = DocumentStatus.PENDING
        if "stage_history" not in doc_data:
            doc_data["stage_history"] = []
        self.documents[doc_id] = doc_data
        return doc_data
    
    async def get_documents_by_org(self, org_id: str, status: Optional[str] = None, entity_id: Optional[str] = None, skip: int = 0, limit: int = 10) -> List[Dict]:
        docs = []
        for doc in self.documents.values():
            if doc["organization_id"] == org_id:
                if status and doc["status"] != status:
                    continue
                if entity_id and doc.get("entity_id") != entity_id:
                    continue
                docs.append(doc)
        
        # Sort by created_at descending
        docs.sort(key=lambda x: x["created_at"], reverse=True)
        
        # Apply pagination
        return docs[skip:skip + limit]
    
    async def get_document_by_id(self, doc_id: str) -> Optional[Dict]:
        return self.documents.get(doc_id)
    
    async def update_document(self, doc_id: str, update_data: Dict) -> Optional[Dict]:
        if doc_id in self.documents:
            self.documents[doc_id].update(update_data)
            return self.documents[doc_id]
        return None
    
    async def count_documents_by_org(self, org_id: str, status: Optional[str] = None) -> int:
        count = 0
        for doc in self.documents.values():
            if doc["organization_id"] == org_id:
                if status is None or doc["status"] == status:
                    count += 1
        return count


# Global instance
memory_db = MemoryDB()