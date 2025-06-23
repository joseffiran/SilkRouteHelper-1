"""
Reference Data Service for Customs Declaration Fields
Handles country codes, currencies, transport types, and other reference data
from Excel files to enhance OCR extraction accuracy
"""

import json
import logging
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

class ReferenceDataService:
    """
    Service for managing and matching reference data from Excel files
    Enhances OCR extraction with intelligent field validation and code lookup
    """
    
    def __init__(self):
        # Initialize reference data dictionaries
        self.country_codes = {}
        self.currency_codes = {}
        self.transport_types = {}
        self.declaration_types = {}
        self.payment_forms = {}
        self.transaction_types = {}
        self.banks = {}
        self.regions = {}
        self.customs_warehouses = {}
        self.transport_conditions = {}
        self.shipping_forms = {}
        self.reference_numbers = {}
        
        # Load all reference data
        self._load_reference_data()
    
    def _load_reference_data(self):
        """Load reference data from known customs codes"""
        
        # Country codes (commonly used in customs)
        self.country_codes = {
            'КАЗАХСТАН': {'code': '398', 'name_ru': 'КАЗАХСТАН', 'name_en': 'KAZAKHSTAN'},
            'РОССИЯ': {'code': '643', 'name_ru': 'РОССИЯ', 'name_en': 'RUSSIA'},
            'УЗБЕКИСТАН': {'code': '860', 'name_ru': 'УЗБЕКИСТАН', 'name_en': 'UZBEKISTAN'},
            'КИТАЙ': {'code': '156', 'name_ru': 'КИТАЙ', 'name_en': 'CHINA'},
            'ГЕРМАНИЯ': {'code': '276', 'name_ru': 'ГЕРМАНИЯ', 'name_en': 'GERMANY'},
            'США': {'code': '840', 'name_ru': 'США', 'name_en': 'USA'},
            'ГОНКОНГ': {'code': '344', 'name_ru': 'ГОНКОНГ', 'name_en': 'HONG KONG'},
            'ЯПОНИЯ': {'code': '392', 'name_ru': 'ЯПОНИЯ', 'name_en': 'JAPAN'},
            'КОРЕЯ': {'code': '410', 'name_ru': 'КОРЕЯ', 'name_en': 'SOUTH KOREA'},
            'ТУРЦИЯ': {'code': '792', 'name_ru': 'ТУРЦИЯ', 'name_en': 'TURKEY'}
        }
        
        # Currency codes
        self.currency_codes = {
            'UZS': {'code': '860', 'name_ru': 'СУМ УЗБЕКИСТАНА', 'name_en': 'UZBEKISTAN SUM'},
            'USD': {'code': '840', 'name_ru': 'ДОЛЛАР США', 'name_en': 'US DOLLAR'},
            'EUR': {'code': '978', 'name_ru': 'ЕВРО', 'name_en': 'EURO'},
            'RUB': {'code': '643', 'name_ru': 'РОССИЙСКИЙ РУБЛЬ', 'name_en': 'RUSSIAN RUBLE'},
            'KZT': {'code': '398', 'name_ru': 'ТЕНГЕ', 'name_en': 'TENGE'},
            'CNY': {'code': '156', 'name_ru': 'ЮАНЬ', 'name_en': 'YUAN'}
        }
        
        # Transport types
        self.transport_types = {
            'ЖД': {'code': '20', 'name_ru': 'ЖЕЛЕЗНОДОРОЖНЫЙ', 'name_en': 'RAILWAY'},
            'АВТО': {'code': '30', 'name_ru': 'АВТОМОБИЛЬНЫЙ', 'name_en': 'ROAD'},
            'АВИА': {'code': '40', 'name_ru': 'ВОЗДУШНЫЙ', 'name_en': 'AIR'},
            'МОРЕ': {'code': '10', 'name_ru': 'МОРСКОЙ', 'name_en': 'SEA'},
            'РЕЧНОЙ': {'code': '80', 'name_ru': 'РЕЧНОЙ', 'name_en': 'INLAND WATERWAY'}
        }
        
        # Declaration types
        self.declaration_types = {
            'ИМ': {'code': '10', 'name_ru': 'ИМПОРТ', 'name_en': 'IMPORT'},
            'ЭК': {'code': '20', 'name_ru': 'ЭКСПОРТ', 'name_en': 'EXPORT'},
            'ТР': {'code': '30', 'name_ru': 'ТРАНЗИТ', 'name_en': 'TRANSIT'},
            'РЕ': {'code': '40', 'name_ru': 'РЕИМПОРТ', 'name_en': 'REIMPORT'},
            'РЭ': {'code': '50', 'name_ru': 'РЕЭКСПОРТ', 'name_en': 'REEXPORT'}
        }
        
        # Payment forms
        self.payment_forms = {
            'ПРЕДОПЛАТА': {'code': '1', 'name_ru': 'ПРЕДОПЛАТА', 'name_en': 'PREPAYMENT'},
            'АККРЕДИТИВ': {'code': '2', 'name_ru': 'АККРЕДИТИВ', 'name_en': 'LETTER OF CREDIT'},
            'ИНКАССО': {'code': '3', 'name_ru': 'ИНКАССО', 'name_en': 'COLLECTION'},
            'БАНКОВСКАЯ ГАРАНТИЯ': {'code': '4', 'name_ru': 'БАНКОВСКАЯ ГАРАНТИЯ', 'name_en': 'BANK GUARANTEE'},
            'ОТКРЫТЫЙ СЧЕТ': {'code': '5', 'name_ru': 'ОТКРЫТЫЙ СЧЕТ', 'name_en': 'OPEN ACCOUNT'}
        }
        
        # Transaction types
        self.transaction_types = {
            'ПРОДАЖА': {'code': '11', 'name_ru': 'ПРОДАЖА', 'name_en': 'SALE'},
            'ПОКУПКА': {'code': '12', 'name_ru': 'ПОКУПКА', 'name_en': 'PURCHASE'},
            'ОБМЕН': {'code': '21', 'name_ru': 'ОБМЕН', 'name_en': 'EXCHANGE'},
            'ВОЗВРАТ': {'code': '31', 'name_ru': 'ВОЗВРАТ', 'name_en': 'RETURN'},
            'ЛИЗИНГ': {'code': '41', 'name_ru': 'ЛИЗИНГ', 'name_en': 'LEASING'}
        }
        
        logger.info("Reference data loaded successfully")
    
    def find_country_by_name(self, text: str) -> Optional[Dict]:
        """Find country by name or partial match"""
        text_upper = text.upper().strip()
        
        # Direct match
        if text_upper in self.country_codes:
            return self.country_codes[text_upper]
        
        # Partial match
        for country_name, data in self.country_codes.items():
            if country_name in text_upper or text_upper in country_name:
                return data
        
        return None
    
    def find_currency_by_code_or_name(self, text: str) -> Optional[Dict]:
        """Find currency by code or name"""
        text_upper = text.upper().strip()
        
        # Direct code match
        if text_upper in self.currency_codes:
            return self.currency_codes[text_upper]
        
        # Name match
        for code, data in self.currency_codes.items():
            if text_upper in data['name_ru'] or text_upper in data['name_en']:
                return data
        
        return None
    
    def find_transport_type(self, text: str) -> Optional[Dict]:
        """Find transport type by abbreviation or name"""
        text_upper = text.upper().strip()
        
        # Direct match
        if text_upper in self.transport_types:
            return self.transport_types[text_upper]
        
        # Pattern matching for common transport indicators
        if 'ЖД' in text_upper or 'ЖЕЛЕЗН' in text_upper or 'RAILWAY' in text_upper:
            return self.transport_types['ЖД']
        elif 'АВТО' in text_upper or 'ROAD' in text_upper or 'TRUCK' in text_upper:
            return self.transport_types['АВТО']
        elif 'АВИА' in text_upper or 'AIR' in text_upper or 'FLIGHT' in text_upper:
            return self.transport_types['АВИА']
        elif 'МОР' in text_upper or 'SEA' in text_upper or 'SHIP' in text_upper:
            return self.transport_types['МОРЕ']
        
        return None
    
    def find_declaration_type(self, text: str) -> Optional[Dict]:
        """Find declaration type by code or description"""
        text_upper = text.upper().strip()
        
        # Direct match
        if text_upper in self.declaration_types:
            return self.declaration_types[text_upper]
        
        # Pattern matching
        if 'ИМПОРТ' in text_upper or 'IMPORT' in text_upper:
            return self.declaration_types['ИМ']
        elif 'ЭКСПОРТ' in text_upper or 'EXPORT' in text_upper:
            return self.declaration_types['ЭК']
        elif 'ТРАНЗИТ' in text_upper or 'TRANSIT' in text_upper:
            return self.declaration_types['ТР']
        
        return None
    
    def enhance_extracted_data(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhance extracted data with reference data lookups
        """
        enhanced_data = extracted_data.copy()
        
        # Enhance country data
        if 'dispatch_country' in extracted_data:
            country_info = self.find_country_by_name(extracted_data['dispatch_country'])
            if country_info:
                enhanced_data['dispatch_country_code'] = country_info['code']
                enhanced_data['dispatch_country_enhanced'] = True
        
        # Enhance currency data
        if 'currency_code' in extracted_data:
            currency_info = self.find_currency_by_code_or_name(extracted_data['currency_code'])
            if currency_info:
                enhanced_data['currency_code_numeric'] = currency_info['code']
                enhanced_data['currency_name'] = currency_info['name_ru']
                enhanced_data['currency_enhanced'] = True
        
        # Enhance transport data
        if 'transport_identity_departure' in extracted_data:
            transport_info = self.find_transport_type(extracted_data['transport_identity_departure'])
            if transport_info:
                enhanced_data['transport_type_code'] = transport_info['code']
                enhanced_data['transport_type_name'] = transport_info['name_ru']
                enhanced_data['transport_enhanced'] = True
        
        # Enhance declaration type
        if 'declaration_type' in extracted_data:
            decl_info = self.find_declaration_type(extracted_data['declaration_type'])
            if decl_info:
                enhanced_data['declaration_type_code'] = decl_info['code']
                enhanced_data['declaration_type_enhanced'] = True
        
        # Add enhancement statistics
        enhanced_fields = sum(1 for key in enhanced_data.keys() if key.endswith('_enhanced'))
        enhanced_data['reference_data_enhancements'] = enhanced_fields
        
        return enhanced_data
    
    def validate_customs_value(self, value: str, currency: str = None) -> Dict[str, Any]:
        """Validate and format customs value"""
        try:
            numeric_value = float(value.replace(',', '.'))
            
            result = {
                'value': numeric_value,
                'formatted': f"{numeric_value:,.2f}",
                'valid': True
            }
            
            if currency:
                currency_info = self.find_currency_by_code_or_name(currency)
                if currency_info:
                    result['currency_code'] = currency_info['code']
                    result['currency_name'] = currency_info['name_ru']
            
            return result
        except (ValueError, AttributeError):
            return {'value': value, 'valid': False, 'error': 'Invalid numeric format'}
    
    def get_reference_stats(self) -> Dict[str, int]:
        """Get statistics about loaded reference data"""
        return {
            'countries': len(self.country_codes),
            'currencies': len(self.currency_codes),
            'transport_types': len(self.transport_types),
            'declaration_types': len(self.declaration_types),
            'payment_forms': len(self.payment_forms),
            'transaction_types': len(self.transaction_types)
        }

# Global instance
reference_data_service = ReferenceDataService()