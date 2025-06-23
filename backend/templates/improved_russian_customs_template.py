"""
Improved Russian Customs Declaration Template
Based on actual declaration structure from user's document
Follows logical sections and field organization for better usability
"""

from sqlalchemy.orm import Session
from models.declaration_template import DeclarationTemplate
from models.template_field import TemplateField
from core.database import get_db

def create_improved_russian_template():
    """Create improved Russian customs declaration template following actual document structure"""
    
    db = next(get_db())
    
    # Check if template already exists
    existing_template = db.query(DeclarationTemplate).filter(
        DeclarationTemplate.name == "Российская таможенная декларация (улучшенная)"
    ).first()
    
    if existing_template:
        print("Улучшенная российская таможенная декларация уже существует")
        return existing_template
    
    # Create new template
    template = DeclarationTemplate(
        name="Российская таможенная декларация (улучшенная)",
        is_active=True
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    
    # Deactivate other templates
    db.query(DeclarationTemplate).filter(
        DeclarationTemplate.id != template.id
    ).update({DeclarationTemplate.is_active: False})
    db.commit()
    
    # Define template fields based on actual declaration structure
    template_fields = [
        # Раздел 1: Основная информация о декларации
        {
            "field_name": "declaration_number",
            "label_ru": "Номер декларации",
            "section": "declaration_info",
            "description": "Номер таможенной декларации",
            "keywords": ["номер декларации", "декларация №", "№"],
            "required": True
        },
        {
            "field_name": "declaration_date",
            "label_ru": "Дата подачи декларации",
            "section": "declaration_info", 
            "description": "Дата подачи таможенной декларации",
            "keywords": ["дата декларации", "дата подачи"],
            "required": True
        },
        {
            "field_name": "customs_post",
            "label_ru": "Таможенный пост",
            "section": "declaration_info",
            "description": "Наименование таможенного поста",
            "keywords": ["таможенный пост", "таможня"],
            "required": True
        },
        
        # Раздел 2: Отправитель/Экспортер (поля 1-5)
        {
            "field_name": "exporter_name",
            "label_ru": "1. Отправитель/Экспортер - наименование",
            "section": "sender_info",
            "description": "Наименование организации-отправителя",
            "keywords": ["отправитель", "экспортер", "наименование отправителя"],
            "required": True
        },
        {
            "field_name": "exporter_address",
            "label_ru": "1. Отправитель/Экспортер - адрес",
            "section": "sender_info",
            "description": "Адрес организации-отправителя",
            "keywords": ["адрес отправителя", "адрес экспортера"],
            "required": True
        },
        {
            "field_name": "exporter_country",
            "label_ru": "2. Страна отправления/экспорта",
            "section": "sender_info",
            "description": "Код или наименование страны отправления",
            "keywords": ["страна отправления", "страна экспорта"],
            "required": True
        },
        
        # Раздел 3: Получатель/Импортер (поля 8-9)
        {
            "field_name": "importer_name",
            "label_ru": "8. Получатель - наименование",
            "section": "recipient_info",
            "description": "Наименование организации-получателя",
            "keywords": ["получатель", "импортер", "наименование получателя"],
            "required": True
        },
        {
            "field_name": "importer_address",
            "label_ru": "8. Получатель - адрес",
            "section": "recipient_info",
            "description": "Адрес организации-получателя",
            "keywords": ["адрес получателя", "адрес импортера"],
            "required": True
        },
        {
            "field_name": "importer_country",
            "label_ru": "8. Страна назначения",
            "section": "recipient_info",
            "description": "Код или наименование страны назначения",
            "keywords": ["страна назначения", "страна импорта"],
            "required": True
        },
        
        # Раздел 4: Транспорт и маршрут (поля 25-30)
        {
            "field_name": "transport_type_border",
            "label_ru": "25. Вид транспорта на границе",
            "section": "transport_info",
            "description": "Код вида транспорта на границе (20-автомобильный)",
            "keywords": ["вид транспорта", "транспорт на границе", "20"],
            "required": True
        },
        {
            "field_name": "transport_type_inland",
            "label_ru": "26. Вид транспорта внутри страны",
            "section": "transport_info",
            "description": "Код вида транспорта внутри страны",
            "keywords": ["транспорт внутри страны", "внутренний транспорт"],
            "required": False
        },
        {
            "field_name": "loading_place",
            "label_ru": "27. Место погрузки/разгрузки",
            "section": "transport_info",
            "description": "Место погрузки или разгрузки товаров",
            "keywords": ["место погрузки", "место разгрузки", "погрузка"],
            "required": True
        },
        {
            "field_name": "financial_info",
            "label_ru": "28. Финансовые и банковские сведения",
            "section": "transport_info",
            "description": "Информация о банке и финансовых операциях",
            "keywords": ["банк", "финансовые сведения", "банковские сведения"],
            "required": False
        },
        {
            "field_name": "border_customs",
            "label_ru": "29. Таможня на границе",
            "section": "transport_info",
            "description": "Код таможенного органа на границе",
            "keywords": ["таможня на границе", "пограничная таможня", "26013"],
            "required": True
        },
        {
            "field_name": "goods_location",
            "label_ru": "30. Местонахождение товара",
            "section": "transport_info",
            "description": "Место нахождения товаров",
            "keywords": ["местонахождение товара", "место товара", "Ташкент"],
            "required": True
        },
        
        # Раздел 5: Упаковка и товары (поля 31-39)
        {
            "field_name": "packages_description",
            "label_ru": "31. Грузовые места - маркировка и количество",
            "section": "goods_info",
            "description": "Описание упаковки и количество грузовых мест",
            "keywords": ["грузовые места", "маркировка", "количество", "контейнеры"],
            "required": True
        },
        {
            "field_name": "goods_serial_number",
            "label_ru": "32. Товар №",
            "section": "goods_info",
            "description": "Порядковый номер товара в декларации",
            "keywords": ["товар №", "номер товара"],
            "required": True
        },
        {
            "field_name": "hs_code",
            "label_ru": "33. Код товара по ТН ВЭД ЕАЭС",
            "section": "goods_info",
            "description": "10-значный код товара по ТН ВЭД",
            "keywords": ["код ТН ВЭД", "ТН ВЭД", "классификационный код", "2710124500"],
            "required": True
        },
        {
            "field_name": "origin_country",
            "label_ru": "34. Код страны происхождения",
            "section": "goods_info",
            "description": "Код страны происхождения товара",
            "keywords": ["страна происхождения", "происхождение", "000"],
            "required": True
        },
        {
            "field_name": "gross_weight",
            "label_ru": "35. Вес брутто (кг)",
            "section": "goods_info",
            "description": "Общий вес товара включая упаковку",
            "keywords": ["вес брутто", "брутто", "кг", "58276"],
            "required": True
        },
        {
            "field_name": "net_weight",
            "label_ru": "38. Вес нетто (кг)",
            "section": "goods_info",
            "description": "Вес товара без упаковки",
            "keywords": ["вес нетто", "нетто", "чистый вес", "56276"],
            "required": True
        },
        {
            "field_name": "goods_description",
            "label_ru": "31. Описание товаров",
            "section": "goods_info",
            "description": "Подробное описание товаров",
            "keywords": ["описание товаров", "наименование товара", "товар"],
            "required": True
        },
        
        # Раздел 6: Таможенные процедуры (поля 37, 40-46)
        {
            "field_name": "customs_procedure",
            "label_ru": "37. Процедура",
            "section": "customs_info",
            "description": "Код таможенной процедуры (40 74 - выпуск для внутреннего потребления)",
            "keywords": ["процедура", "таможенная процедура", "40 74"],
            "required": True
        },
        {
            "field_name": "preceding_document",
            "label_ru": "40. Общая декларация/предшествующий документ",
            "section": "customs_info",
            "description": "Номер предшествующего документа",
            "keywords": ["предшествующий документ", "общая декларация"],
            "required": False
        },
        {
            "field_name": "additional_info",
            "label_ru": "44. Дополнительная информация",
            "section": "customs_info",
            "description": "Дополнительные сведения и коды",
            "keywords": ["дополнительная информация", "доп. информация"],
            "required": False
        },
        {
            "field_name": "adjustment_amount",
            "label_ru": "45. Доначисления",
            "section": "customs_info",
            "description": "Сумма доначислений",
            "keywords": ["доначисления", "45105.63"],
            "required": False
        },
        {
            "field_name": "statistical_value",
            "label_ru": "46. Статистическая стоимость",
            "section": "customs_info",
            "description": "Статистическая стоимость товаров",
            "keywords": ["статистическая стоимость", "45 106"],
            "required": False
        },
        
        # Раздел 7: Расчет платежей (поля 47-49)
        {
            "field_name": "calculation_base",
            "label_ru": "47. Исчисление таможенных платежей - Основа начисления",
            "section": "payments_info",
            "description": "Основа для расчета таможенных платежей",
            "keywords": ["основа начисления", "571404435.63"],
            "required": True
        },
        {
            "field_name": "duty_rate",
            "label_ru": "47. Исчисление таможенных платежей - Ставка",
            "section": "payments_info",
            "description": "Ставка таможенной пошлины",
            "keywords": ["ставка", "4025", "33500"],
            "required": True
        },
        {
            "field_name": "duty_amount",
            "label_ru": "47. Исчисление таможенных платежей - Сумма",
            "section": "payments_info",
            "description": "Сумма к доплате",
            "keywords": ["сумма", "1500000", "19522460", "7091227.48"],
            "required": True
        },
        {
            "field_name": "payment_deferral",
            "label_ru": "48. Отсрочка платежей",
            "section": "payments_info",
            "description": "Информация об отсрочке платежей",
            "keywords": ["отсрочка платежей", "отсрочка"],
            "required": False
        },
        {
            "field_name": "warehouse_info",
            "label_ru": "49. Наименование склада",
            "section": "payments_info",
            "description": "Наименование таможенного склада",
            "keywords": ["склад", "наименование склада"],
            "required": False
        },
        
        # Раздел 8: Сертификаты и документы
        {
            "field_name": "invoice_number",
            "label_ru": "Номер инвойса",
            "section": "documents_info",
            "description": "Номер коммерческого счета (инвойса)",
            "keywords": ["инвойс", "invoice", "счет"],
            "required": True
        },
        {
            "field_name": "invoice_date",
            "label_ru": "Дата инвойса",
            "section": "documents_info", 
            "description": "Дата выставления коммерческого счета",
            "keywords": ["дата инвойса", "дата счета"],
            "required": True
        },
        {
            "field_name": "contract_number",
            "label_ru": "Номер контракта",
            "section": "documents_info",
            "description": "Номер внешнеторгового контракта",
            "keywords": ["контракт", "договор"],
            "required": False
        },
        {
            "field_name": "certificate_quality",
            "label_ru": "Сертификат качества",
            "section": "documents_info",
            "description": "Номер сертификата качества товара",
            "keywords": ["сертификат качества", "качество"],
            "required": False
        },
        {
            "field_name": "certificate_origin",
            "label_ru": "Сертификат происхождения",
            "section": "documents_info",
            "description": "Номер сертификата происхождения товара",
            "keywords": ["сертификат происхождения", "происхождение"],
            "required": False
        }
    ]
    
    # Create template fields
    for field_data in template_fields:
        field = TemplateField(
            template_id=template.id,
            field_name=field_data["field_name"],
            label_ru=field_data["label_ru"],
            extraction_rules={
                "section": field_data["section"],
                "description": field_data["description"],
                "keywords": field_data["keywords"],
                "required": field_data["required"]
            }
        )
        db.add(field)
    
    db.commit()
    
    print(f"Улучшенная российская таможенная декларация создана с {len(template_fields)} полями")
    print("Поля организованы по логическим разделам:")
    
    sections = {}
    for field in template_fields:
        section = field["section"]
        if section not in sections:
            sections[section] = []
        sections[section].append(field["label_ru"])
    
    section_names = {
        "declaration_info": "Информация о декларации",
        "sender_info": "Отправитель/Экспортер", 
        "recipient_info": "Получатель/Импортер",
        "transport_info": "Транспорт и маршрут",
        "goods_info": "Товары и упаковка",
        "customs_info": "Таможенные процедуры",
        "payments_info": "Расчет платежей",
        "documents_info": "Документы и сертификаты"
    }
    
    for section_key, fields in sections.items():
        section_name = section_names.get(section_key, section_key)
        print(f"\n{section_name}: {len(fields)} полей")
        for field in fields[:3]:  # Показать первые 3 поля
            print(f"  - {field}")
        if len(fields) > 3:
            print(f"  ... и еще {len(fields) - 3} полей")
    
    return template

if __name__ == "__main__":
    create_improved_russian_template()