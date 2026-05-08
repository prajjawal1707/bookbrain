import uuid
from datetime import datetime
from typing import Dict, Optional


class PackageStore:
    def __init__(self):
        self._store: Dict[str, Dict] = {}

    def save(self, package: Dict) -> str:
        pkg_id = str(uuid.uuid4())[:8]
        self._store[pkg_id] = {
            **package,
            "id": pkg_id,
            "created_at": datetime.utcnow().isoformat(),
        }
        return pkg_id

    def get(self, pkg_id: str) -> Optional[Dict]:
        return self._store.get(pkg_id)

    def list_all(self) -> list:
        return [
            {
                "id":               v["id"],
                "book_title":       v.get("book_title"),
                "author":           v.get("author"),
                "total_principles": v.get("total_principles_extracted", 0),
                "created_at":       v.get("created_at"),
                "summary":          v.get("summary", ""),
                # include full data so frontend can use it directly
                "philosophical_framework": v.get("philosophical_framework", {}),
                "principles":              v.get("principles", []),
                "behavioral_guidelines":   v.get("behavioral_guidelines", []),
                "cautions":                v.get("cautions", []),
            }
            for v in self._store.values()
        ]

    def delete(self, pkg_id: str) -> bool:
        if pkg_id in self._store:
            del self._store[pkg_id]
            return True
        return False

    @property
    def count(self) -> int:
        return len(self._store)


# Singleton
store = PackageStore()
