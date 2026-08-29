import { describe, expect, it } from "vitest";
import { regions } from "./index";
import {
  buildShortSurveyLink,
  buildSurveyFormUrl,
  findSurveyRegion,
  findSurveySegment,
  SURVEY_REGIONS,
  SURVEY_SEGMENTS,
} from "./surveyLinks";

// The survey's Region question only accepts four fixed strings — this
// mapping exists specifically so nobody can hand out a link for a region
// the live form does not actually recognise.

describe("survey link mapping", () => {
  it("only offers regions that are actual app regions with no published data", () => {
    for (const option of SURVEY_REGIONS) {
      const region = regions.find((r) => r.id === option.id);
      expect(region, option.id).toBeDefined();
      expect(region?.dataQuality, option.id).toBe("none");
    }
  });

  it("offers the four requested market segments", () => {
    expect(SURVEY_SEGMENTS.map((s) => s.id)).toEqual([
      "french-fry",
      "crisps",
      "fresh-washed-brushed",
      "seed",
    ]);
  });

  it("builds a general survey link with no prefill when nothing is given", () => {
    const url = buildSurveyFormUrl();
    expect(url).toContain("viewform");
    expect(url).not.toContain("entry.2115047702");
    expect(url).not.toContain("entry.714400903");
  });

  it("prefills the region and segment entry ids when both are recognised", () => {
    const url = buildSurveyFormUrl("vic-central", "seed");
    expect(url).toContain("entry.2115047702=Victoria");
    expect(url).toContain("entry.714400903=Seed");
  });

  it("ignores an unrecognised region or segment id rather than sending junk text", () => {
    const url = buildSurveyFormUrl("not-a-region", "not-a-segment");
    expect(url).not.toContain("entry.2115047702");
    expect(url).not.toContain("entry.714400903");
  });

  it("resolves every declared region and segment id back to an option", () => {
    for (const region of SURVEY_REGIONS) {
      expect(findSurveyRegion(region.id)).toBe(region);
    }
    for (const segment of SURVEY_SEGMENTS) {
      expect(findSurveySegment(segment.id)).toBe(segment);
    }
    expect(findSurveyRegion("nope")).toBeUndefined();
    expect(findSurveySegment("nope")).toBeUndefined();
  });

  it("builds a short app-relative redirect link that carries both ids", () => {
    const url = buildShortSurveyLink("vic-mallee", "crisps", "https://example.com/spudonomics/");
    expect(url).toBe("https://example.com/spudonomics/#/survey/vic-mallee/crisps");
  });
});
