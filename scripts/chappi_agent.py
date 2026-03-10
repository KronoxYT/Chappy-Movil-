#!/usr/bin/env python3
"""
Chappi PC Agent - Simulated for testing
This script simulates a PC agent that connects to the Chappi network
and sends hardware profile data.

Usage:
  python chappi_agent.py --server http://localhost:3000 --code ABCD1234
  
For real Windows implementation, see chappi_perfil_hardware.py
"""

import argparse
import json
import random
import socket
import time
import sys
from datetime import datetime

try:
    import requests
except ImportError:
    print("Installing requests...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests


class SimulatedHardwareProfile:
    """Generates simulated hardware profiles for testing"""
    
    CPU_MODELS = [
        ("Intel Core i9-13900K", 24, 32, 5800),
        ("Intel Core i7-13700K", 16, 24, 5400),
        ("Intel Core i5-13600K", 14, 20, 5000),
        ("AMD Ryzen 9 7950X", 16, 32, 5700),
        ("AMD Ryzen 7 7700X", 8, 16, 5500),
        ("AMD Ryzen 5 7600X", 6, 12, 5300),
    ]
    
    GPU_MODELS = [
        ("NVIDIA RTX 4090", 24576),
        ("NVIDIA RTX 4080", 16384),
        ("NVIDIA RTX 3080", 10240),
        ("NVIDIA RTX 3070", 8192),
        ("AMD RX 7900 XTX", 24576),
    ]
    
    def __init__(self, hostname: str = None):
        self.hostname = hostname or socket.gethostname()
        self.ip = self._get_local_ip()
        self.mac = self._generate_mac()
        
        # Random hardware config
        cpu = random.choice(self.CPU_MODELS)
        gpu = random.choice(self.GPU_MODELS)
        
        self.profile = {
            "timestamp": datetime.now().isoformat(),
            "hostname": self.hostname,
            "ip_local": self.ip,
            "cpu": {
                "modelo": cpu[0],
                "fabricante": "Intel" if "Intel" in cpu[0] else "AMD",
                "nucleos_fisicos": cpu[1],
                "hilos_logicos": cpu[2],
                "frecuencia_max_mhz": cpu[3],
                "frecuencia_actual_mhz": random.randint(int(cpu[3] * 0.3), cpu[3]),
                "uso_actual_porcentaje": random.randint(10, 60),
                "cache_l2_kb": random.randint(2048, 16384),
                "cache_l3_kb": random.randint(16384, 65536),
                "arquitectura": "x64"
            },
            "ram": {
                "total_gb": random.choice([16, 32, 64, 128]),
                "usado_gb": 0,
                "libre_gb": 0,
                "uso_porcentaje": random.randint(20, 70),
                "disponible_gb": 0
            },
            "discos": self._generate_disks(),
            "gpu": {
                "GPU_0": {
                    "nombre": gpu[0],
                    "fabricante": "NVIDIA" if "NVIDIA" in gpu[0] else "AMD",
                    "memoria_total_mb": gpu[1],
                    "driver_version": "531.18",
                    "status": "OK",
                    "uso_porcentaje": random.randint(0, 50)
                }
            },
            "acceso": {
                "usuario": f"user_{random.randint(1000, 9999)}",
                "dominio": "WORKGROUP",
                "es_administrador": random.choice([True, False]),
                "uptime_sesion": f"{random.randint(0, 24)}h {random.randint(0, 59)}m",
                "sistema_operativo": random.choice([
                    "Windows 11 Pro", "Windows 11 Home", "Windows 10 Pro", 
                    "Windows 10 Enterprise", "Ubuntu 22.04 LTS"
                ]),
                "nombre_computadora": self.hostname,
                "privilegios_elevados": "Sí" if random.random() > 0.5 else "No"
            }
        }
        
        # Calculate RAM values
        total_ram = self.profile["ram"]["total_gb"]
        usage_pct = self.profile["ram"]["uso_porcentaje"]
        self.profile["ram"]["usado_gb"] = round(total_ram * usage_pct / 100, 1)
        self.profile["ram"]["libre_gb"] = round(total_ram * (100 - usage_pct) / 100, 1)
        self.profile["ram"]["disponible_gb"] = self.profile["ram"]["libre_gb"]
    
    def _get_local_ip(self) -> str:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "192.168.1.100"
    
    def _generate_mac(self) -> str:
        return ':'.join(['{:02x}'.format(random.randint(0, 255)) for _ in range(6)])
    
    def _generate_disks(self) -> dict:
        disks = {}
        disk_configs = [
            ("C:", "System", "SSD", 512),
            ("D:", "Data", "SSD", 1024),
            ("E:", "Backup", "HDD", 2048),
        ]
        
        for letter, name, dtype, size in disk_configs[:random.randint(1, 3)]:
            used_pct = random.randint(20, 90)
            disks[letter] = {
                "nombre": name,
                "total_gb": size,
                "usado_gb": round(size * used_pct / 100, 1),
                "libre_gb": round(size * (100 - used_pct) / 100, 1),
                "uso_porcentaje": used_pct,
                "tipo": dtype,
                "sistema_archivos": "NTFS"
            }
        
        return disks
    
    def update_metrics(self):
        """Update CPU, RAM, GPU usage for real-time simulation"""
        self.profile["cpu"]["uso_actual_porcentaje"] = random.randint(10, 90)
        self.profile["cpu"]["frecuencia_actual_mhz"] = random.randint(
            int(self.profile["cpu"]["frecuencia_max_mhz"] * 0.3),
            self.profile["cpu"]["frecuencia_max_mhz"]
        )
        
        ram_usage = random.randint(20, 80)
        self.profile["ram"]["uso_porcentaje"] = ram_usage
        self.profile["ram"]["usado_gb"] = round(self.profile["ram"]["total_gb"] * ram_usage / 100, 1)
        self.profile["ram"]["libre_gb"] = round(self.profile["ram"]["total_gb"] * (100 - ram_usage) / 100, 1)
        
        self.profile["gpu"]["GPU_0"]["uso_porcentaje"] = random.randint(0, 100)
        self.profile["timestamp"] = datetime.now().isoformat()
        
        return self.profile


class ChappiAgent:
    """Chappi PC Agent that connects to the network"""
    
    def __init__(self, server_url: str):
        self.server_url = server_url
        self.token = None
        self.node_id = None
        self.hardware = None
        
    def link_with_code(self, code: str, hostname: str = None):
        """Link this PC using a linking code"""
        print(f"\n{'='*60}")
        print(f"🔗 CHAPPI AGENT - LINKING")
        print(f"{'='*60}")
        
        # Generate hardware profile
        print(f"\n📊 Generating hardware profile...")
        self.hardware = SimulatedHardwareProfile(hostname)
        
        print(f"  Hostname: {self.hardware.hostname}")
        print(f"  IP: {self.hardware.ip}")
        print(f"  MAC: {self.hardware.mac}")
        print(f"  CPU: {self.hardware.profile['cpu']['modelo']}")
        print(f"  RAM: {self.hardware.profile['ram']['total_gb']} GB")
        print(f"  GPU: {self.hardware.profile['gpu']['GPU_0']['nombre']}")
        
        # Validate code with server
        print(f"\n🔗 Validating code: {code}")
        
        try:
            response = requests.post(
                f"{self.server_url}/api/linking/validate",
                json={
                    "code": code,
                    "hostname": self.hardware.hostname,
                    "ip": self.hardware.ip,
                    "mac": self.hardware.mac,
                    "hardwareProfile": self.hardware.profile
                },
                timeout=10
            )
            
            data = response.json()
            
            if response.status_code == 200 and data.get("success"):
                self.node_id = data["nodeId"]
                self.token = data["token"]
                
                print(f"\n✅ Successfully linked!")
                print(f"  Node ID: {self.node_id}")
                print(f"  Token: {self.token[:20]}...")
                
                # Save configuration
                config = {
                    "node_id": self.node_id,
                    "token": self.token,
                    "server_url": self.server_url,
                    "hostname": self.hardware.hostname,
                    "linked_at": datetime.now().isoformat()
                }
                
                with open("chappi_config.json", "w") as f:
                    json.dump(config, f, indent=2)
                
                print(f"\n💾 Configuration saved to chappi_config.json")
                return True
            else:
                print(f"\n❌ Linking failed: {data.get('error', 'Unknown error')}")
                return False
                
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            return False


def main():
    parser = argparse.ArgumentParser(description="Chappi PC Agent")
    parser.add_argument("--server", default="http://localhost:3000", help="Server URL")
    parser.add_argument("--code", required=True, help="Linking code")
    parser.add_argument("--hostname", help="Override hostname")
    
    args = parser.parse_args()
    
    agent = ChappiAgent(args.server)
    agent.link_with_code(args.code, args.hostname)


if __name__ == "__main__":
    main()
