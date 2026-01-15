def calculate_severity_and_claim(detections):
    severity_rank = {"scratch": 1, "dent": 2, "broken": 3, "severe": 4}
    cost_ranges = {"scratch": (500, 5000), "dent": (1500, 8000), "broken": (3000, 15000), "severe": (25000, 100000)}

    if not detections:
        return {"final_damage": "none", "severity_level": 0, "claim_approved": False, "confidence": 0, "estimated_cost_range": "₹0"}

    highest_severity = 0
    final_class = "scratch"
    avg_confidence = sum(d["confidence"] for d in detections) / len(detections)
    damage_counts = {}

    for d in detections:
        cls = d["class"]
        damage_counts[cls] = damage_counts.get(cls, 0) + 1
        if severity_rank[cls] > highest_severity:
            highest_severity = severity_rank[cls]
            final_class = cls

    # Severe dominates all
    if final_class == "severe":
        min_cost, max_cost = cost_ranges["severe"]
    else:
        min_cost, max_cost = cost_ranges[final_class]
        
        # Modifier A: Multiple instances
        total_count = sum(damage_counts.values())
        if total_count == 2:
            min_cost = int(min_cost * 1.2)
            max_cost = int(max_cost * 1.2)
        elif total_count >= 3:
            min_cost = int(min_cost * 1.4)
            max_cost = int(max_cost * 1.4)
        
        # Modifier D: Broken part premium
        if final_class == "broken":
            max_cost = int(max_cost * 1.15)

    # Modifier C: Confidence-based range adjustment
    if avg_confidence < 0.5:
        range_width = max_cost - min_cost
        min_cost = int(min_cost - range_width * 0.15)
        max_cost = int(max_cost + range_width * 0.15)
    elif avg_confidence > 0.8:
        range_width = max_cost - min_cost
        min_cost = int(min_cost + range_width * 0.1)
        max_cost = int(max_cost - range_width * 0.1)

    return {
        "final_damage": final_class,
        "severity_level": highest_severity,
        "claim_approved": highest_severity >= 2,
        "confidence": round(avg_confidence, 2),
        "estimated_cost_range": f"₹{min_cost:,} – ₹{max_cost:,}",
        "damage_count": len(detections)
    }
