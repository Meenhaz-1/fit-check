# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### 1. Health Check

Verify API is running and OpenAI connection works.

**Request:**
```
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-05-28T12:34:56.789Z"
}
```

---

### 2. Extract Metadata from Image

Analyzes clothing in an image and extracts detailed metadata.

**Request:**
```
POST /wardrobe/upload
Content-Type: application/json

{
  "image": "string (base64)",
  "mediaType": "image/jpeg | image/png | image/webp | image/gif",
  "itemDescription": "string (1-80 chars)"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/wardrobe/upload \
  -H "Content-Type: application/json" \
  -d '{
    "image": "iVBORw0KGgoAAAANS...",
    "mediaType": "image/jpeg",
    "itemDescription": "red t-shirt"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "metadata": {
    "item_type": "t-shirt",
    "color": "red",
    "material": "cotton",
    "formality": "casual",
    "fit": "regular",
    "silhouette": "straight",
    "visual_weight": "light"
  },
  "timestamp": "2025-05-28T12:34:56.789Z"
}
```

**Metadata Fields:**

| Field | Type | Description | Examples |
|-------|------|-------------|----------|
| item_type | string | Clothing type | t-shirt, shirt, dress, jacket, jeans, etc. |
| color | string | Primary color | red, navy blue, cream, burnt orange |
| material | string | Fabric type | cotton, silk, denim, wool, leather |
| formality | string | Context level | casual, business casual, business, formal |
| fit | string | Body fit | slim, regular, loose, fitted, oversized |
| silhouette | string | Shape | straight, tapered, A-line, fitted, flowing |
| visual_weight | string | Thickness | light, medium, heavy |

**Error Responses:**

```json
// 400 - Bad Request
{
  "error": "No image data provided"
}

// 413 - Payload Too Large
{
  "error": "Image too large"
}

// 429 - Rate Limited
{
  "error": "Too many requests"
}

// 500 - Server Error
{
  "success": false,
  "error": "Failed to extract metadata",
  "timestamp": "2025-05-28T12:34:56.789Z"
}
```

**Validation Rules:**

| Field | Rule |
|-------|------|
| image | Required, base64 string, max 5MB |
| mediaType | Optional (default: image/jpeg), must be jpeg/png/webp/gif |
| itemDescription | Optional (default: "clothing item"), 1-80 alphanumeric + hyphens |

**Rate Limiting:**
- 20 requests per minute per IP address
- Returns 429 if exceeded

---

### 3. Detect Items in Image

Identifies all clothing items visible in an image.

**Request:**
```
POST /wardrobe/detect
Content-Type: application/json

{
  "image": "string (base64)",
  "mediaType": "image/jpeg | image/png | image/webp | image/gif"
}
```

**Response (200):**
```json
{
  "success": true,
  "items": [
    "Black button-up shirt",
    "Dark jeans",
    "White sneakers"
  ],
  "timestamp": "2025-05-28T12:34:56.789Z"
}
```

---

### 4. Save to Wardrobe

Saves extracted metadata to user's wardrobe.

**Request:**
```
POST /wardrobe/save
Content-Type: application/json

{
  "metadata": {
    "item_type": "t-shirt",
    "color": "red",
    "material": "cotton",
    "formality": "casual",
    "fit": "regular",
    "silhouette": "straight",
    "visual_weight": "light"
  },
  "notes": "string (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "id": "abc123def456",
  "timestamp": "2025-05-28T12:34:56.789Z"
}
```

---

## Implementation Example

### JavaScript/TypeScript

```typescript
async function extractMetadata(imageFile: File, itemDesc: string) {
  // Convert image to base64
  const reader = new FileReader();
  reader.readAsDataURL(imageFile);
  
  reader.onload = async (e) => {
    const base64 = e.target.result;
    
    const response = await fetch('/api/wardrobe/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64,
        mediaType: imageFile.type,
        itemDescription: itemDesc
      })
    });
    
    const data = await response.json();
    console.log('Extracted metadata:', data.metadata);
  };
}
```

### Python

```python
import requests
import base64

def extract_metadata(image_path: str, item_description: str):
    # Read and encode image
    with open(image_path, 'rb') as f:
        image_base64 = base64.b64encode(f.read()).decode('utf-8')
    
    # Make API call
    response = requests.post(
        'http://localhost:3000/api/wardrobe/upload',
        json={
            'image': image_base64,
            'mediaType': 'image/jpeg',
            'itemDescription': item_description
        }
    )
    
    result = response.json()
    return result['metadata']
```

---

## Best Practices

1. **Item Description**: Be specific (e.g., "red cotton t-shirt" vs "shirt")
2. **Image Quality**: Use clear, well-lit photos for best results
3. **Image Size**: Compress images to under 3MB for faster processing
4. **Error Handling**: Implement retry logic with exponential backoff
5. **Caching**: Cache extracted metadata to avoid re-processing

---

## Rate Limiting

- **Limit**: 20 requests per minute per IP
- **Status Code**: 429 (Too Many Requests)
- **Reset**: Automatic after 1 minute

To check remaining quota, track response timestamps and requests.

---

## OpenAI Model Details

- **Model**: gpt-4o (vision-capable)
- **Max Tokens**: 256 per request
- **Processing Time**: ~1-3 seconds per image

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Image too large" | Compress image to <5MB |
| "Invalid image data" | Ensure base64 encoding is valid |
| "Invalid media type" | Use jpeg, png, webp, or gif |
| "Too many requests" | Wait 1 minute before retrying |
| OpenAI timeout | Retry after 5 seconds |

---

## Changelog

### v1.0 (Current)
- Metadata extraction with 7 fields
- Image detection
- Rate limiting
- Ground truth evaluation framework
