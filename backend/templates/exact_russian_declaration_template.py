"""
Exact Russian Customs Declaration Template
Based on the actual declaration photos provided by user
Creates template with fields numbered 1-54 matching the official form structure
"""

from sqlalchemy.orm import Session
from models.declaration_template import DeclarationTemplate
from models.template_field import TemplateField
from core.database import get_db

def create_exact_russian_declaration():
    """Create exact Russian customs declaration template matching official form 1-54"""
    
    db = next(get_db())
    
    # Check if template already exists
    existing_template = db.query(DeclarationTemplate).filter(
        DeclarationTemplate.name == "Грузовая Таможенная Декларация (точная копия)"
    ).first()
    
    if existing_template:
        print("Точная копия грузовой таможенной декларации уже существует")
        return existing_template
    
    # Create new template
    template = DeclarationTemplate(
        name="Грузовая Таможенная Декларация (точная копия)",
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
    
    # Define exact template fields matching the declaration form 1-54
    template_fields = [
        # Header Information
        {
            "field_name": "declaration_type",
            "label_ru": "1. Тип декларации",
            "section": "header_info",
            "description": "Тип декларации (ГТД, ТД)",
            "keywords": ["тип декларации", "ГТД", "ТД"],
            "required": True
        },
        
        # Section 2-4: Sender/Exporter Information
        {
            "field_name": "sender_exporter",
            "label_ru": "2. Отправитель/Экспортер",
            "section": "sender_info",
            "description": "Наименование и данные отправителя/экспортера",
            "keywords": ["отправитель", "экспортер", "GIGAFLEX ASIA LIMITED"],
            "required": True
        },
        {
            "field_name": "sender_by_order",
            "label_ru": "2. по поручению:",
            "section": "sender_info", 
            "description": "Лицо, действующее по поручению отправителя",
            "keywords": ["по поручению", "представитель"],
            "required": False
        },
        {
            "field_name": "additional_sheet",
            "label_ru": "3. Доб.лист",
            "section": "header_info",
            "description": "Номер дополнительного листа",
            "keywords": ["дополнительный лист", "доб.лист"],
            "required": False
        },
        {
            "field_name": "sender_spec",
            "label_ru": "4. Отпр. спец",
            "section": "sender_info",
            "description": "Специальные условия отправителя",
            "keywords": ["отпр. спец", "специальные условия"],
            "required": False
        },
        
        # Section 5-7: Goods Information
        {
            "field_name": "total_goods_names",
            "label_ru": "5. Всего наим. т-ов",
            "section": "goods_info",
            "description": "Общее количество наименований товаров",
            "keywords": ["всего наим", "наименований товаров", "1"],
            "required": True
        },
        {
            "field_name": "total_packages",
            "label_ru": "6. Кол-во мест",
            "section": "goods_info",
            "description": "Общее количество грузовых мест",
            "keywords": ["кол-во мест", "количество мест", "1"],
            "required": True
        },
        {
            "field_name": "reference_number",
            "label_ru": "7. Справочный номер",
            "section": "header_info",
            "description": "Справочный номер декларации",
            "keywords": ["справочный номер", "26010", "18.06.2025", "0034784"],
            "required": False
        },
        
        # Section 8: Recipient/Importer
        {
            "field_name": "recipient_importer",
            "label_ru": "8. Получатель/Импортер",
            "section": "recipient_info",
            "description": "Наименование и данные получателя/импортера",
            "keywords": ["получатель", "импортер", "GAZ-NEFT-AVTO BENZIN"],
            "required": True
        },
        
        # Section 9: Financial Information
        {
            "field_name": "financial_person",
            "label_ru": "9. Лицо, ответственное за финансовое урегулирование",
            "section": "financial_info",
            "description": "Данные лица, ответственного за финансы",
            "keywords": ["финансовое урегулирование", "ответственное лицо"],
            "required": True
        },
        
        # Section 10-13: Origin and Destination
        {
            "field_name": "country_first_destination",
            "label_ru": "10. Страна 1-го назнач.",
            "section": "location_info",
            "description": "Страна первого назначения",
            "keywords": ["страна назначения", "45105.63"],
            "required": True
        },
        {
            "field_name": "trading_country",
            "label_ru": "11. Торг. страна",
            "section": "location_info",
            "description": "Торговая страна",
            "keywords": ["торговая страна", "45105.63"],
            "required": True
        },
        {
            "field_name": "customs_value",
            "label_ru": "12. [Таможенная стоимость]",
            "section": "financial_info",
            "description": "Таможенная стоимость товара",
            "keywords": ["45105.63", "таможенная стоимость"],
            "required": True
        },
        {
            "field_name": "field_13",
            "label_ru": "13. [Поле 13]",
            "section": "location_info",
            "description": "Дополнительная информация поля 13",
            "keywords": ["12658.14"],
            "required": False
        },
        
        # Section 14: Declarant/Representative
        {
            "field_name": "declarant_representative",
            "label_ru": "14. Декларант/представитель",
            "section": "declarant_info",
            "description": "Данные декларанта или представителя",
            "keywords": ["декларант", "представитель", "DS GLOBAL"],
            "required": True
        },
        
        # Section 15-17: Country Information
        {
            "field_name": "dispatch_country",
            "label_ru": "15. Страна отправления",
            "section": "location_info",
            "description": "Страна отправления товара",
            "keywords": ["страна отправления", "КАЗАХСТАН"],
            "required": True
        },
        {
            "field_name": "origin_country_code",
            "label_ru": "15a. Код страны отправл.",
            "section": "location_info",
            "description": "Код страны отправления",
            "keywords": ["398", "код страны"],
            "required": True
        },
        {
            "field_name": "destination_country_code",
            "label_ru": "17a. Код страны назнач.",
            "section": "location_info",
            "description": "Код страны назначения",
            "keywords": ["код страны назначения"],
            "required": True
        },
        {
            "field_name": "origin_country",
            "label_ru": "16. Страна происхождения",
            "section": "location_info",
            "description": "Страна происхождения товара",
            "keywords": ["страна происхождения"],
            "required": True
        },
        {
            "field_name": "destination_country",
            "label_ru": "17. Страна назначения",
            "section": "location_info",
            "description": "Страна назначения товара",
            "keywords": ["страна назначения"],
            "required": True
        },
        
        # Section 18-24: Transport Information  
        {
            "field_name": "transport_identity_departure",
            "label_ru": "18. Транспортное средство при отправлении",
            "section": "transport_info",
            "description": "Идентификация транспортного средства при отправлении",
            "keywords": ["транспортное средство", "ЖД 73054884", "398"],
            "required": True
        },
        {
            "field_name": "container_number",
            "label_ru": "19. [Номер контейнера]",
            "section": "transport_info",
            "description": "Номер контейнера",
            "keywords": ["контейнер", "1398"],
            "required": False
        },
        {
            "field_name": "delivery_terms",
            "label_ru": "20. Условия поставки",
            "section": "transport_info",
            "description": "Условия поставки товара",
            "keywords": ["условия поставки", "07", "CPT"],
            "required": True
        },
        {
            "field_name": "transport_border",
            "label_ru": "21. Транспортное средство на границе",
            "section": "transport_info",
            "description": "Транспортное средство на границе",
            "keywords": ["ЖД 73054884", "398", "на границе"],
            "required": True
        },
        {
            "field_name": "currency_invoice",
            "label_ru": "22. Валюта и общая фактурная стоимость",
            "section": "financial_info",
            "description": "Валюта и общая стоимость по фактуре",
            "keywords": ["валюта", "45105.63", "фактурная стоимость"],
            "required": True
        },
        {
            "field_name": "exchange_rate",
            "label_ru": "23. Курс валюты",
            "section": "financial_info",
            "description": "Курс валюты к национальной валюте",
            "keywords": ["курс валюты", "1", "12658.14"],
            "required": True
        },
        {
            "field_name": "nature_transaction",
            "label_ru": "24. Характер сделки",
            "section": "financial_info",
            "description": "Характер торговой сделки",
            "keywords": ["характер сделки", "01", "840"],
            "required": True
        },
        
        # Section 25-30: Transport and Location Details
        {
            "field_name": "transport_mode_border",
            "label_ru": "25. Вид транспорта на границе",
            "section": "transport_info",
            "description": "Код вида транспорта на границе",
            "keywords": ["вид транспорта", "на границе", "20"],
            "required": True
        },
        {
            "field_name": "transport_mode_inland",
            "label_ru": "26. Вид транспорта внутри страны",
            "section": "transport_info",
            "description": "Код вида транспорта внутри страны",
            "keywords": ["транспорт внутри страны", "20"],
            "required": False
        },
        {
            "field_name": "loading_place",
            "label_ru": "27. Место погрузки/разгрузки",
            "section": "transport_info",
            "description": "Место погрузки или разгрузки товара",
            "keywords": ["место погрузки", "разгрузки"],
            "required": True
        },
        {
            "field_name": "financial_banking_info",
            "label_ru": "28. Финансовые и банковские сведения",
            "section": "financial_info",
            "description": "Финансовые и банковские сведения",
            "keywords": ["финансовые сведения", "банковские", "302637691", "201178469"],
            "required": False
        },
        {
            "field_name": "customs_office_border",
            "label_ru": "29. Таможня на границе",
            "section": "customs_info",
            "description": "Код таможенного органа на границе",
            "keywords": ["таможня на границе", "26013"],
            "required": True
        },
        {
            "field_name": "goods_location",
            "label_ru": "30. Место досмотра товара",
            "section": "customs_info",
            "description": "Место нахождения/досмотра товара",
            "keywords": ["место досмотра", "1726283 г. Ташкент"],
            "required": True
        },
        
        # Section 31-39: Package and Goods Details
        {
            "field_name": "packages_marks_numbers",
            "label_ru": "31. Грузовые места и описание товаров - Маркировка и количество",
            "section": "goods_info",
            "description": "Маркировка и количество грузовых мест, описание товаров",
            "keywords": ["грузовые места", "маркировка", "автомобильный бензин", "79.6560", "K5", "АИ-95-К5"],
            "required": True
        },
        {
            "field_name": "item_number",
            "label_ru": "32. Товар №",
            "section": "goods_info", 
            "description": "Порядковый номер товара",
            "keywords": ["товар №", "1"],
            "required": True
        },
        {
            "field_name": "commodity_code",
            "label_ru": "33. Код товара",
            "section": "goods_info",
            "description": "Код товара по ТН ВЭД ЕАЭС",
            "keywords": ["код товара", "2710124500"],
            "required": True
        },
        {
            "field_name": "country_origin_code",
            "label_ru": "34. Код страны происх.",
            "section": "goods_info",
            "description": "Код страны происхождения товара", 
            "keywords": ["код страны происхождения", "000"],
            "required": True
        },
        {
            "field_name": "gross_mass",
            "label_ru": "35. Вес брутто (кг)",
            "section": "goods_info",
            "description": "Масса брутто в килограммах",
            "keywords": ["вес брутто", "58276", "кг"],
            "required": True
        },
        {
            "field_name": "net_mass",
            "label_ru": "38. Вес нетто (кг)",
            "section": "goods_info",
            "description": "Масса нетто в килограммах",
            "keywords": ["вес нетто", "58276", "кг"],
            "required": True
        },
        {
            "field_name": "customs_procedure_code",
            "label_ru": "37. Процедура",
            "section": "customs_info",
            "description": "Код таможенной процедуры",
            "keywords": ["процедура", "40 74", "000"],
            "required": True
        },
        {
            "field_name": "quota",
            "label_ru": "39. Квота",
            "section": "customs_info",
            "description": "Информация о квоте",
            "keywords": ["квота"],
            "required": False
        },
        
        # Section 40-46: Additional Information and Calculations
        {
            "field_name": "general_declaration",
            "label_ru": "40. Общая декларация/предшествующий документ",
            "section": "customs_info",
            "description": "Ссылка на общую декларацию или предшествующий документ",
            "keywords": ["общая декларация", "26010", "29.05.2025", "0031350"],
            "required": False
        },
        {
            "field_name": "additional_units",
            "label_ru": "41. Доп.ед.изм.",
            "section": "goods_info",
            "description": "Дополнительные единицы измерения",
            "keywords": ["доп.ед.изм", "130"],
            "required": False
        },
        {
            "field_name": "item_price",
            "label_ru": "42. Фактур. стоим. т-ра",
            "section": "financial_info",
            "description": "Фактурная стоимость товара",
            "keywords": ["фактурная стоимость", "45105.63"],
            "required": True
        },
        {
            "field_name": "adjustment_field_43",
            "label_ru": "43. [Поле 43]",
            "section": "financial_info",
            "description": "Корректировки и дополнительная информация",
            "keywords": ["43"],
            "required": False
        },
        {
            "field_name": "additional_information",
            "label_ru": "44. Дополнительная информация",
            "section": "customs_info",
            "description": "Дополнительная информация, коды и ссылки",
            "keywords": ["дополнительная информация", "207", "ОМГС", "220", "ИНВ", "223"],
            "required": False
        },
        {
            "field_name": "adjustment_field_45",
            "label_ru": "45. [Корректировки]",
            "section": "financial_info",
            "description": "Корректировки и доначисления",
            "keywords": ["45105.63", "корректировки"],
            "required": False
        },
        {
            "field_name": "statistical_value",
            "label_ru": "46. Статистическая стоимость",
            "section": "financial_info",
            "description": "Статистическая стоимость для учета",
            "keywords": ["статистическая стоимость", "45 106"],
            "required": False
        },
        
        # Section 47-49: Duty Calculations
        {
            "field_name": "duty_calculation_type",
            "label_ru": "47. Исчисление таможенных пошлин и сборов - Вид",
            "section": "payments_info",
            "description": "Вид таможенных платежей",
            "keywords": ["исчисление", "вид", "10", "27", "29"],
            "required": True
        },
        {
            "field_name": "duty_base",
            "label_ru": "47. Основа начисления",
            "section": "payments_info",
            "description": "Основа для начисления платежей",
            "keywords": ["основа начисления", "571404435.63", "57140435.63"],
            "required": True
        },
        {
            "field_name": "duty_rate",
            "label_ru": "47. Ставка",
            "section": "payments_info",
            "description": "Ставка таможенных платежей",
            "keywords": ["ставка", "375000", "4025", "33500", "12"],
            "required": True
        },
        {
            "field_name": "duty_amount",
            "label_ru": "47. Сумма",
            "section": "payments_info",
            "description": "Сумма таможенных платежей",
            "keywords": ["сумма", "1500000", "19522460", "7091227.48"],
            "required": True
        },
        {
            "field_name": "payment_method",
            "label_ru": "47. СП",
            "section": "payments_info",
            "description": "Способ платежа",
            "keywords": ["СП", "БН"],
            "required": True
        },
        {
            "field_name": "payment_deferral",
            "label_ru": "48. Отсрочка платежей",
            "section": "payments_info",
            "description": "Отсрочка уплаты таможенных платежей",
            "keywords": ["отсрочка платежей"],
            "required": False
        },
        {
            "field_name": "warehouse_name",
            "label_ru": "49. Наименование склада",
            "section": "customs_info",
            "description": "Наименование таможенного склада",
            "keywords": ["наименование склада"],
            "required": False
        },
        
        # Section 50-54: Final Information and Signatures
        {
            "field_name": "responsible_person",
            "label_ru": "50. Доверитель",
            "section": "declarant_info",
            "description": "Ответственность за предоставленные сведения",
            "keywords": ["доверитель", "ответственность", "Директор", "Исломов У.К."],
            "required": True
        },
        {
            "field_name": "customs_office_declaration",
            "label_ru": "51. Таможенный орган подачи декларации",
            "section": "customs_info",
            "description": "Место и дата подачи декларации",
            "keywords": ["таможенный орган", "место и дата"],
            "required": True
        },
        {
            "field_name": "invalidity_guarantee",
            "label_ru": "52. Гарантия недействительна для",
            "section": "customs_info",
            "description": "Условия недействительности гарантии",
            "keywords": ["гарантия недействительна"],
            "required": False
        },
        {
            "field_name": "customs_destination_office",
            "label_ru": "53. Таможня и страна назначения",
            "section": "customs_info",
            "description": "Таможенный орган страны назначения",
            "keywords": ["таможня назначения"],
            "required": False
        },
        {
            "field_name": "place_date_signature",
            "label_ru": "54. Место и дата:",
            "section": "declarant_info",
            "description": "Место и дата подписания, подпись декларанта",
            "keywords": ["место и дата", "г.Ташкент", "Садилов Камиль Маратович"],
            "required": True
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
    
    print(f"Точная копия грузовой таможенной декларации создана с {len(template_fields)} полями")
    print("Поля соответствуют официальной форме с номерами 1-54")
    
    sections = {}
    for field in template_fields:
        section = field["section"]
        if section not in sections:
            sections[section] = []
        sections[section].append(field["label_ru"])
    
    section_names = {
        "header_info": "Заголовок и общая информация",
        "sender_info": "Отправитель/Экспортер",
        "recipient_info": "Получатель/Импортер", 
        "declarant_info": "Декларант и подписи",
        "location_info": "Географическая информация",
        "transport_info": "Транспорт и перевозка",
        "goods_info": "Товары и упаковка",
        "customs_info": "Таможенные процедуры",
        "financial_info": "Финансовая информация",
        "payments_info": "Расчет платежей"
    }
    
    for section_key, fields in sections.items():
        section_name = section_names.get(section_key, section_key)
        print(f"\n{section_name}: {len(fields)} полей")
    
    return template

if __name__ == "__main__":
    create_exact_russian_declaration()