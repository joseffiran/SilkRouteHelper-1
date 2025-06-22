"""
Initialize Russian Customs Declaration Template
Creates a default template with fields extracted from the Russian customs declaration forms.
"""

import os
import sys
from sqlalchemy.orm import Session
from core.database import get_db
from models.declaration_template import DeclarationTemplate
from models.template_field import TemplateField

def create_russian_template():
    """Create Russian customs declaration template with predefined fields."""
    
    # Get database session
    db = next(get_db())
    
    try:
        # Check if template already exists
        existing_template = db.query(DeclarationTemplate).filter(
            DeclarationTemplate.name == "Russian Customs Declaration 2025"
        ).first()
        
        if existing_template:
            print("Russian template already exists. Skipping...")
            return
        
        # Create the template
        template = DeclarationTemplate(
            name="Russian Customs Declaration 2025",
            is_active=True
        )
        db.add(template)
        db.commit()
        db.refresh(template)
        
        print(f"Created template: {template.name} (ID: {template.id})")
        
        # Define fields based on the Russian customs declaration forms
        fields = [
            {
                "field_name": "declaration_number",
                "label_ru": "Грузовая таможенная декларация №",
                "extraction_rules": {
                    "type": "regex",
                    "pattern": r"ГРУЗОВАЯ ТАМОЖЕННАЯ ДЕКЛАРАЦИЯ\s+№\s*([A-Z0-9]+)"
                }
            },
            {
                "field_name": "declaration_type",
                "label_ru": "Тип декларации",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Новая"
                }
            },
            {
                "field_name": "exporter_company",
                "label_ru": "Экспортер/грузоотп.",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Экспортер/грузоотп"
                }
            },
            {
                "field_name": "importer_company",
                "label_ru": "Импортер/грузопол.",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Импортер/грузопол"
                }
            },
            {
                "field_name": "country_origin",
                "label_ru": "Страна:",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Страна:"
                }
            },
            {
                "field_name": "declarant_representative",
                "label_ru": "Декларант/представитель",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Декларант/представитель"
                }
            },
            {
                "field_name": "reference_number",
                "label_ru": "Справочный номер",
                "extraction_rules": {
                    "type": "regex",
                    "pattern": r"Справочный номер[\s\n]+([0-9.]+)"
                }
            },
            {
                "field_name": "additional_sheet",
                "label_ru": "Доб. лист",
                "extraction_rules": {
                    "type": "regex",
                    "pattern": r"Доб\. лист[\s\n]+([0-9]+)"
                }
            },
            {
                "field_name": "additional_spec",
                "label_ru": "Отгр. спец.",
                "extraction_rules": {
                    "type": "regex",
                    "pattern": r"Отгр\. спец\.[\s\n]+([0-9]+)"
                }
            },
            {
                "field_name": "total_packages",
                "label_ru": "Всего наим. т-ов",
                "extraction_rules": {
                    "type": "regex",
                    "pattern": r"Всего наим\.\s*т-ов[\s\n]+([0-9]+)"
                }
            },
            {
                "field_name": "packages_count",
                "label_ru": "Кол-во мест",
                "extraction_rules": {
                    "type": "regex",
                    "pattern": r"Кол-во мест[\s\n]+([0-9]+)"
                }
            },
            {
                "field_name": "responsible_person",
                "label_ru": "Лицо, ответст. за финан. урегулирование",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Лицо, ответст. за финан. урегулирование"
                }
            },
            {
                "field_name": "country_1",
                "label_ru": "Страна 1-го",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Страна 1-го"
                }
            },
            {
                "field_name": "trade_country",
                "label_ru": "Торг. страна",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Торг. страна"
                }
            },
            {
                "field_name": "customs_value",
                "label_ru": "Общ. тамож. стоим-ть",
                "extraction_rules": {
                    "type": "regex",
                    "pattern": r"Общ\. тамож\. стоим-ть[\s\n]+([0-9,]+)"
                }
            },
            {
                "field_name": "departure_country",
                "label_ru": "Страна отправления",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Страна отправления"
                }
            },
            {
                "field_name": "destination_country",
                "label_ru": "Страна назначения",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Страна назначения"
                }
            },
            {
                "field_name": "origin_country",
                "label_ru": "Страна происхождения",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Страна происхождения"
                }
            },
            {
                "field_name": "container_info",
                "label_ru": "Контейнер",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Контейнер"
                }
            },
            {
                "field_name": "delivery_terms",
                "label_ru": "Условия поставки",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Условия поставки"
                }
            },
            {
                "field_name": "transport_border",
                "label_ru": "Транспортное средство на границе",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Транспортное средство на границе"
                }
            },
            {
                "field_name": "transport_inland",
                "label_ru": "Вид тр-та внутри страны",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Вид тр-та внутри страны"
                }
            },
            {
                "field_name": "transport_location",
                "label_ru": "Местонахождение т",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Местонахождение т"
                }
            },
            {
                "field_name": "currency_rate",
                "label_ru": "Курс валюты",
                "extraction_rules": {
                    "type": "regex",
                    "pattern": r"Курс валюты[\s\n]+([0-9,]+)"
                }
            },
            {
                "field_name": "payment_deferral",
                "label_ru": "Отсрочка платежей",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Отсрочка платежей"
                }
            },
            {
                "field_name": "warehouse_name",
                "label_ru": "Наименование склада",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Наименование склада"
                }
            },
            {
                "field_name": "customs_location",
                "label_ru": "Таможня и страна назначения",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Таможня и страна назначения"
                }
            },
            {
                "field_name": "transit_guarantees",
                "label_ru": "Гарантия недействительна для",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Гарантия недействительна для"
                }
            },
            {
                "field_name": "payment_details",
                "label_ru": "Подробности подсчета",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Подробности подсчета"
                }
            },
            {
                "field_name": "total_amount",
                "label_ru": "Итого:",
                "extraction_rules": {
                    "type": "regex",
                    "pattern": r"Итого:[\s\n]+([0-9,]+)"
                }
            },
            {
                "field_name": "authorized_person",
                "label_ru": "Доверитель",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Доверитель"
                }
            },
            {
                "field_name": "customs_transit",
                "label_ru": "Таможня и страна назначения",
                "extraction_rules": {
                    "type": "keyword",
                    "keyword": "Таможня и страна назначения"
                }
            },
            {
                "field_name": "location_date",
                "label_ru": "Место и дата:",
                "extraction_rules": {
                    "type": "regex",
                    "pattern": r"Место и дата:[\s\n]+([^\n]+)"
                }
            },
            {
                "field_name": "gtd_number",
                "label_ru": "№ ГТД:",
                "extraction_rules": {
                    "type": "regex",
                    "pattern": r"№ ГТД:[\s\n]+([0-9/]+)"
                }
            },
            {
                "field_name": "contract_date",
                "label_ru": "№ и дата договора:",
                "extraction_rules": {
                    "type": "regex",
                    "pattern": r"№ и дата договора:[\s\n]+([^\n]+)"
                }
            },
            {
                "field_name": "tax_id",
                "label_ru": "ИНН/ПИНФЛ:",
                "extraction_rules": {
                    "type": "regex",
                    "pattern": r"ИНН/ПИНФЛ:[\s\n]+([0-9]+)"
                }
            }
        ]
        
        # Create template fields
        for field_data in fields:
            field = TemplateField(
                template_id=template.id,
                field_name=field_data["field_name"],
                label_ru=field_data["label_ru"],
                extraction_rules=field_data["extraction_rules"]
            )
            db.add(field)
        
        db.commit()
        print(f"Created {len(fields)} template fields")
        print("Russian customs declaration template initialized successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error creating template: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_russian_template()