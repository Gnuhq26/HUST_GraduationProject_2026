import sys
import argparse
import datetime
import io
import os
from dotenv import load_dotenv
from cloudflare import Cloudflare

# Ép buộc sys.stdout và sys.stderr sử dụng utf-8 để tránh lỗi 'charmap' trên Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# ĐỌC API TOKEN TỪ FILE .env (backend/.env)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))
CLOUDFLARE_API_TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN')
if not CLOUDFLARE_API_TOKEN:
    print("Lỗi: CLOUDFLARE_API_TOKEN chưa được khai báo trong file .env")
    sys.exit(1)

def log_action():
    """Ghi lại câu lệnh thực thi vào file log"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    full_cmd = f"python {' '.join(sys.argv)}"
    with open("DNSCloudFlare.txt", "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {full_cmd}\n")

def list_all_domains(client):
    """Lấy và hiển thị tất cả các domain đang quản lý"""
    try:
        print("\n--- Các domain đang quản lý trong tài khoản ---")
        zones = client.zones.list()
        if not zones.result:
            print("Không tìm thấy domain nào.")
        for i, zone in enumerate(zones.result, 1):
            print(f"{i}. {zone.name} (ID: {zone.id})")
        print("-" * 80)
    except Exception as e:
        print(f"Không thể liệt kê domain: {e}")

def list_dns_records(client, zone_id, domain_name):
    """Liệt kê tất cả các bản ghi DNS của một domain cụ thể"""
    try:
        print(f"\n--- DANH SÁCH BẢN GHI DNS CỦA: {domain_name} ---")
        print(f"{'TYPE':<8} {'NAME':<40} {'CONTENT'}")
        print("-" * 80)
        records = client.dns.records.list(zone_id=zone_id)
        for r in records.result:
            print(f"{r.type:<8} {r.name:<40} {r.content}")
        print("-" * 80)
    except Exception as e:
        print(f"Lỗi khi liệt kê bản ghi: {e}")
        
def main():
    # Khởi tạo Client với Token khai báo sẵn
    client = Cloudflare(api_token=CLOUDFLARE_API_TOKEN)

    usage_examples = """
Ví dụ sử dụng:
  1. Tạo bản ghi A trỏ subdomain về IP:
     python ./DNSCloudFlare.py -n abc.com -t A -e dev=1.2.3.4
     
  2. Tạo bản ghi CNAME cho subdomain:
     python ./DNSCloudFlare.py -n abc.com -t CNAME -e blog=mysite.com
     
  3. Tạo bản ghi TXT cho subdomain:
     python ./DNSCloudFlare.py -n abc.com -t TXT -e _acme-challenge.subdomain=59roeodf0so
    """

    parser = argparse.ArgumentParser(
        description='Cloudflare DNS Manager SDK v4',
        epilog=usage_examples,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        add_help=False
    )

    parser.add_argument('-h', '--help', action='help', help='Hiển thị hướng dẫn này')
    parser.add_argument('-v', '--verbose', action='store_true', help='Hiển thị chi tiết log')
    parser.add_argument('-n', '--name', help='Domain chính (vd: abc.com)')
    parser.add_argument('-t', '--type', help='Loại bản ghi (A, CNAME, TXT...)')
    parser.add_argument('-e', '--entry', help='Cú pháp sub=giá_trị (vd: sub=1.2.3.4, _acme=fsfu922j0)')
    parser.add_argument('-f', '--force', action='store_true', help='Ghi đè bản ghi nếu đã tồn tại mà không cần hỏi')

    # Kiểm tra nếu không có tham số nào được truyền vào
    if len(sys.argv) == 1:
        parser.print_help()
        list_all_domains(client)
        sys.exit(0)

    args = parser.parse_args()


    try:
        # Lấy Zone ID của domain
        zones = client.zones.list(name=args.name)
        if not zones.result:
            print(f"Lỗi: Không tìm thấy domain '{args.name}'")
            list_all_domains(client)
            sys.exit(1)
        zone_id = zones.result[0].id
        
        # 2. Chỉ có tham số -n -> Liệt kê các record của domain đó
        if args.name and not args.type and not args.entry:
            list_dns_records(client, zone_id, args.name)
            sys.exit(0) 
                    
        # 3. Có đầy đủ tham số -> Thực hiện thêm/sửa bản ghi
        if not args.type or not args.entry:
            print("\nLỗi: Để tạo bản ghi, bạn cần cung cấp đầy đủ -t (type) và -e (entry).")
            sys.exit(1)

        # Tách dữ liệu từ --entry
        if '=' not in args.entry:
            print("Lỗi: Tham số --entry phải có định dạng 'subdomain=giá_trị'")
            sys.exit(1)
            
        sub_name, dns_content = args.entry.split('=', 1)
        full_name = args.name if sub_name == "@" else f"{sub_name}.{args.name}"
           
        # 4. Kiểm tra bản ghi cũ
        records = client.dns.records.list(zone_id=zone_id, name=full_name, type=args.type)
        
        new_data = {
            "name": full_name,
            "type": args.type,
            "content": dns_content,
            "proxied": False,
            "ttl": 3600
        }

        action_performed = False

        if records.result:
            old_record = records.result[0]
            print(f"(!) Bản ghi {args.type} cho {full_name} đã tồn tại: {old_record.content}")
            
            # Nếu có tham số -f thì cho qua luôn, nếu không thì mới hỏi y/n
            confirm = 'y' if args.force else input("    Ghi đè (Overwrite)? (y/n): ").lower()
            
            if confirm == 'y':
                client.dns.records.update(dns_record_id=old_record.id, zone_id=zone_id, **new_data)
                print(f"==> Cập nhật thành công: {full_name}")
                action_performed = True
        else:
            client.dns.records.create(zone_id=zone_id, **new_data)
            print(f"==> Tạo mới thành công: {full_name} -> {dns_content}")
            action_performed = True

        if action_performed:
            log_action()
            if args.verbose: print("[Verbose] Đã ghi log.")

    except Exception as e:
        print(f"Lỗi: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()