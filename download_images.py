import os
import requests
import time

def download_images():
    output_dir = "app/static/images"
    os.makedirs(output_dir, exist_ok=True)
    
    # 25 VERIFIED HIGH-QUALITY SKINCARE IDS
    verified_ids = [
        "1598440947619-2c35fc9aa908", "1620916566398-39f1143ab7be", "1556228720-195a672e8a03", "1596755094514-f87e34085b2c",
        "1556229167-73fe9a286049", "1612817288484-6f916006741a", "1535585209827-a15fcdbc4c2d", "1526947425960-945c6e72858f",
        "1616394584738-fc6e612e71b9", "1560750588-73207b1ef5b8", "1556228578-8c89e6adf883", "1560750587-c598066518a4",
        "1620917231450-49651c676752", "1621236316039-441621a1ca6a", "1620916297397-a4a0c24a6cd2", "1608248597278-ca41d5c4e0f5",
        "1556227833-0137e4fb4422", "1612817287733-4f93335d138c", "1570172206833-28148b61c7c3", "1612817287667-27b2b6c934ba",
        "1556228578-43d9943ba67a", "1556228578-904099478f79", "1556229034-7505d933ba67", "1612141853413-5a7a72382e7d",
        "1556228578-a4a0c24a6cd1"
    ]
    
    total_to_download = 50
    downloaded = 0
    
    print(f"Starting CACHE-BUSTING download with 'skin_v3_' prefix...")
    
    for i in range(total_to_download):
        # NEW PREFIX TO BUST CACHE
        filename = f"skin_v3_{i+1}.jpg"
        filepath = os.path.join(output_dir, filename)
        
        img_id = verified_ids[i % len(verified_ids)]
        url = f"https://images.unsplash.com/photo-{img_id}?q=80&w=600&h=600&auto=format&fit=crop"
        
        try:
            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(response.content)
                downloaded += 1
                print(f"[{downloaded}/{total_to_download}] Downloaded: {filename}")
            else:
                print(f"[{i+1}/{total_to_download}] Failed ID {img_id}")
            
            time.sleep(0.3)
        except Exception as e:
            print(f"Error downloading {filename}: {str(e)}")

    print(f"\nCache-busting library successfully populated with {downloaded} images!")

if __name__ == "__main__":
    download_images()
