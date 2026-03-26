# Contributing to Allergy Scan (AAS)

Thank you for helping make Korean food safer for everyone with allergies!

## How to Contribute Food Data

We welcome food image datasets from any country. Each contribution expands allergy safety to more cuisines.

### Data Format Requirements

```
data/
└── {country_code}/          # e.g., japan, thailand, vietnam
    ├── {food_class}/        # e.g., ramen, pad_thai
    │   ├── img_001.jpg
    │   ├── img_002.jpg
    │   └── ...
    └── label_map.json       # multilingual food name mapping
```

### Image Requirements

| Item | Requirement |
|---|---|
| Size | 224 × 224 px (JPEG) |
| Min images per class | 50 |
| Max blur | Laplacian variance ≥ 100 |
| Duplicates | None (MD5 checked) |
| License | CC BY 4.0 or compatible |

### label_map.json Format

```json
{
  "ramen": {
    "ko": "라멘",
    "en": "Ramen",
    "ja": "ラーメン",
    "zh": "拉面"
  }
}
```

### Allergen Mapping (label_ingredient_map.json)

Each food class should include a corresponding entry in `data/label_ingredient_map.json`:

```json
{
  "ramen": {
    "ingredients": ["wheat noodles", "soy sauce", "pork", "egg"],
    "allergens": ["밀", "대두", "돼지고기", "난류"],
    "source": "community"
  }
}
```

### Steps to Contribute

1. Fork this repository
2. Create a branch: `git checkout -b add-{country}-food-data`
3. Add images under `data/{country_code}/{food_class}/`
4. Update `data/label_ingredient_map.json`
5. Run the validation script: `python scripts/validate_dataset.py --country {country_code}`
6. Open a Pull Request

### PR Review Criteria

- [ ] Minimum 50 images per class
- [ ] Images are 224×224 JPEG
- [ ] No blurry images (blur check passes)
- [ ] No duplicate images
- [ ] `label_ingredient_map.json` updated
- [ ] Allergens correctly listed (use Korean allergen names from the 22-allergen standard)

### Contact

Questions? Open an issue or contact the maintainer.

---

*This project started as a Seoul Open Data Plaza Competition entry (2026) and is growing into a global food allergy safety platform.*
