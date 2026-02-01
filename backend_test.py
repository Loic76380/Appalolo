#!/usr/bin/env python3
"""
Matrix VPS Monitor - Backend API Testing
Tests all authentication and monitoring endpoints
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class MatrixVPSAPITester:
    def __init__(self, base_url: str = "https://ovh-dashboard.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200, use_auth: bool = False) -> tuple[bool, Dict]:
        """Make HTTP request and validate response"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if use_auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            if not success:
                response_data["status_code"] = response.status_code
                response_data["expected_status"] = expected_status

            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        success, data = self.make_request('GET', '/')
        self.log_test("Root endpoint (/api/)", success, 
                     data.get('error', '') if not success else f"Message: {data.get('message', 'N/A')}")
        
        # Test health endpoint
        success, data = self.make_request('GET', '/health')
        self.log_test("Health endpoint (/api/health)", success,
                     data.get('error', '') if not success else f"Status: {data.get('status', 'N/A')}")

    def test_user_registration(self):
        """Test user registration"""
        print("\n🔍 Testing User Registration...")
        
        # Generate unique test email
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        test_email = f"test_user_{timestamp}@matrix.test"
        test_password = "TestMatrix123!"
        
        success, data = self.make_request('POST', '/auth/register', {
            "email": test_email,
            "password": test_password
        }, expected_status=200)
        
        if success:
            self.token = data.get('access_token')
            self.user_data = data.get('user')
            self.log_test("User registration", True, f"User ID: {self.user_data.get('id', 'N/A')}")
        else:
            self.log_test("User registration", False, data.get('detail', data.get('error', 'Unknown error')))

    def test_user_login(self):
        """Test user login with provided credentials"""
        print("\n🔍 Testing User Login...")
        
        # Test with provided credentials
        success, data = self.make_request('POST', '/auth/login', {
            "email": "loicchampanay@gmail.com",
            "password": "Pixel76380*"
        }, expected_status=200)
        
        if success:
            self.token = data.get('access_token')
            self.user_data = data.get('user')
            self.log_test("User login (provided credentials)", True, f"Email: {self.user_data.get('email', 'N/A')}")
        else:
            self.log_test("User login (provided credentials)", False, 
                         data.get('detail', data.get('error', 'Unknown error')))

    def test_auth_me(self):
        """Test getting current user info"""
        print("\n🔍 Testing Auth Me Endpoint...")
        
        if not self.token:
            self.log_test("Get current user (/auth/me)", False, "No token available")
            return
        
        success, data = self.make_request('GET', '/auth/me', use_auth=True)
        self.log_test("Get current user (/auth/me)", success,
                     data.get('error', '') if not success else f"User: {data.get('email', 'N/A')}")

    def test_vps_metrics(self):
        """Test VPS metrics endpoints"""
        print("\n🔍 Testing VPS Metrics...")
        
        if not self.token:
            self.log_test("VPS metrics endpoints", False, "No token available")
            return

        # Test current metrics
        success, data = self.make_request('GET', '/metrics/current', use_auth=True)
        if success:
            required_fields = ['cpu_percent', 'ram_used_gb', 'disk_percent', 'network_in_mbps', 'uptime_seconds']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("Current metrics structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Current metrics (/metrics/current)", True, 
                             f"CPU: {data.get('cpu_percent', 0)}%, RAM: {data.get('ram_used_gb', 0)}GB")
        else:
            self.log_test("Current metrics (/metrics/current)", False, data.get('error', 'Unknown error'))

        # Test metrics history
        success, data = self.make_request('GET', '/metrics/history?hours=1', use_auth=True)
        if success and isinstance(data, list):
            self.log_test("Metrics history (/metrics/history)", True, f"History points: {len(data)}")
        else:
            self.log_test("Metrics history (/metrics/history)", False, 
                         "Invalid response format" if success else data.get('error', 'Unknown error'))

    def test_processes_endpoint(self):
        """Test processes endpoint"""
        print("\n🔍 Testing Processes Endpoint...")
        
        if not self.token:
            self.log_test("Processes endpoint", False, "No token available")
            return

        success, data = self.make_request('GET', '/processes', use_auth=True)
        if success and isinstance(data, list):
            if data:
                required_fields = ['pid', 'name', 'cpu_percent', 'memory_percent', 'status', 'user']
                first_process = data[0]
                missing_fields = [field for field in required_fields if field not in first_process]
                if missing_fields:
                    self.log_test("Processes structure", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Processes endpoint (/processes)", True, f"Processes count: {len(data)}")
            else:
                self.log_test("Processes endpoint (/processes)", False, "Empty processes list")
        else:
            self.log_test("Processes endpoint (/processes)", False, 
                         "Invalid response format" if success else data.get('error', 'Unknown error'))

    def test_services_endpoint(self):
        """Test services endpoint"""
        print("\n🔍 Testing Services Endpoint...")
        
        if not self.token:
            self.log_test("Services endpoint", False, "No token available")
            return

        success, data = self.make_request('GET', '/services', use_auth=True)
        if success and isinstance(data, list):
            if data:
                required_fields = ['name', 'status', 'active', 'description']
                first_service = data[0]
                missing_fields = [field for field in required_fields if field not in first_service]
                if missing_fields:
                    self.log_test("Services structure", False, f"Missing fields: {missing_fields}")
                else:
                    active_services = sum(1 for svc in data if svc.get('active', False))
                    self.log_test("Services endpoint (/services)", True, 
                                 f"Services: {len(data)}, Active: {active_services}")
            else:
                self.log_test("Services endpoint (/services)", False, "Empty services list")
        else:
            self.log_test("Services endpoint (/services)", False,
                         "Invalid response format" if success else data.get('error', 'Unknown error'))

    def test_apps_endpoint(self):
        """Test installed apps endpoint"""
        print("\n🔍 Testing Apps Endpoint...")
        
        if not self.token:
            self.log_test("Apps endpoint", False, "No token available")
            return

        success, data = self.make_request('GET', '/apps', use_auth=True)
        if success and isinstance(data, list):
            if data:
                required_fields = ['name', 'version', 'size']
                first_app = data[0]
                missing_fields = [field for field in required_fields if field not in first_app]
                if missing_fields:
                    self.log_test("Apps structure", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Apps endpoint (/apps)", True, f"Installed apps: {len(data)}")
            else:
                self.log_test("Apps endpoint (/apps)", False, "Empty apps list")
        else:
            self.log_test("Apps endpoint (/apps)", False,
                         "Invalid response format" if success else data.get('error', 'Unknown error'))

    def test_vps_info_endpoint(self):
        """Test VPS info endpoint"""
        print("\n🔍 Testing VPS Info Endpoint...")
        
        if not self.token:
            self.log_test("VPS info endpoint", False, "No token available")
            return

        success, data = self.make_request('GET', '/vps/info', use_auth=True)
        if success:
            required_fields = ['hostname', 'ip', 'os', 'kernel', 'architecture', 'provider']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                self.log_test("VPS info structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("VPS info endpoint (/vps/info)", True, 
                             f"IP: {data.get('ip', 'N/A')}, OS: {data.get('os', 'N/A')}")
        else:
            self.log_test("VPS info endpoint (/vps/info)", False, data.get('error', 'Unknown error'))

    def test_preferences_endpoints(self):
        """Test preferences endpoints"""
        print("\n🔍 Testing Preferences Endpoints...")
        
        if not self.token:
            self.log_test("Preferences endpoints", False, "No token available")
            return

        # Test get preferences
        success, data = self.make_request('GET', '/preferences', use_auth=True)
        if success and isinstance(data, list):
            self.log_test("Get preferences (/preferences)", True, f"Preferences count: {len(data)}")
            
            # Test update preferences
            if data:
                update_data = {
                    "preferences": [
                        {"metric_id": data[0]["id"], "enabled": not data[0]["enabled"]}
                    ]
                }
                success, response = self.make_request('PUT', '/preferences', update_data, use_auth=True)
                self.log_test("Update preferences (PUT /preferences)", success,
                             response.get('error', '') if not success else "Preferences updated")
        else:
            self.log_test("Get preferences (/preferences)", False,
                         "Invalid response format" if success else data.get('error', 'Unknown error'))

    def test_unauthorized_access(self):
        """Test endpoints without authentication"""
        print("\n🔍 Testing Unauthorized Access...")
        
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        endpoints_to_test = [
            '/metrics/current',
            '/processes',
            '/services',
            '/apps',
            '/preferences'
        ]
        
        for endpoint in endpoints_to_test:
            success, data = self.make_request('GET', endpoint, expected_status=401, use_auth=False)
            self.log_test(f"Unauthorized access {endpoint}", success,
                         "Should return 401" if success else f"Got {data.get('status_code', 'unknown')} instead of 401")
        
        # Restore token
        self.token = original_token

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Matrix VPS Monitor API Tests")
        print(f"🎯 Target: {self.base_url}")
        print("=" * 60)
        
        # Run test suites
        self.test_health_endpoints()
        self.test_user_registration()
        self.test_user_login()
        self.test_auth_me()
        self.test_vps_metrics()
        self.test_processes_endpoint()
        self.test_services_endpoint()
        self.test_apps_endpoint()
        self.test_vps_info_endpoint()
        self.test_preferences_endpoints()
        self.test_unauthorized_access()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    """Main test runner"""
    tester = MatrixVPSAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())