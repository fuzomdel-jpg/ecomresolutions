"""Enrich e-commerce leads with short outreach hooks using DSPy and Groq.

Reads leads_input.csv, compacts each row, and writes enriched_leads.csv.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import dspy
import pandas as pd
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
INPUT_PATH = BASE_DIR / "leads_input.csv"
OUTPUT_PATH = BASE_DIR / "enriched_leads.csv"
OUTPUT_FIELDS = ("opening", "hook1", "hook2", "offer", "subject")

load_dotenv(BASE_DIR / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is missing. Add it to .env before running dspy_main.py.")

lm = dspy.LM(
    model="groq/llama-3.1-8b-instant",
    api_key=GROQ_API_KEY,
    temperature=0.1,
    max_tokens=150,
)
dspy.configure(lm=lm)


class EcomAuditSignature(dspy.Signature):
    """Write short e-commerce outreach copy from compacted brand context."""

    brand_info: str = dspy.InputField(desc="Minified brand, marketplace, lead, and issues")
    opening: str = dspy.OutputField(desc="Short opening line")
    hook1: str = dspy.OutputField(desc="Short first outreach hook")
    hook2: str = dspy.OutputField(desc="Short second outreach hook")
    offer: str = dspy.OutputField(desc="Short offer line")
    subject: str = dspy.OutputField(desc="Short email subject line")


class LeadAuditModule(dspy.Module):
    """Compact a lead into a token-light string, then predict outreach fields."""

    def __init__(self) -> None:
        super().__init__()
        self.predict = dspy.Predict(EcomAuditSignature)

    def forward(self, brand: str, marketplace: str, name: str, title: str, issues: str):
        brand_info = f"Brand:{brand}|Mkt:{marketplace}|Lead:{name}({title})|Issues:{issues[:250]}"
        return self.predict(brand_info=brand_info)


def _text(value: object) -> str:
    if value is None:
        return ""
    try:
        if pd.isna(value):
            return ""
    except (TypeError, ValueError):
        pass
    return str(value).strip()


def enrich_leads(
    input_path: Path = INPUT_PATH,
    output_path: Path = OUTPUT_PATH,
) -> pd.DataFrame:
    """Run each lead through LeadAuditModule and export a structured CSV."""
    if not input_path.exists():
        raise FileNotFoundError(f"Lead file not found: {input_path}")

    leads = pd.read_csv(input_path)
    module = LeadAuditModule()
    records: list[dict[str, object]] = []

    for index, row in leads.iterrows():
        record = {column: row[column] for column in leads.columns}
        try:
            result = module(
                brand=_text(row.get("brand")),
                marketplace=_text(row.get("marketplace")),
                name=_text(row.get("name")),
                title=_text(row.get("title")),
                issues=_text(row.get("issues")),
            )
            for field in OUTPUT_FIELDS:
                record[field] = _text(getattr(result, field, ""))
            record["error"] = ""
        except Exception as exc:
            print(f"Lead row {index} failed: {exc}", file=sys.stderr)
            for field in OUTPUT_FIELDS:
                record[field] = ""
            record["error"] = str(exc)
        records.append(record)

    enriched = pd.DataFrame(records)
    enriched.to_csv(output_path, index=False)
    return enriched


if __name__ == "__main__":
    frame = enrich_leads()
    print(f"Wrote {len(frame)} rows to {OUTPUT_PATH}")
