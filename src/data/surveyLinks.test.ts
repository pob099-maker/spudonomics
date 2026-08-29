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

// The survey's Region question only accepts a fixed set of strings — this
// mapping exists specifically so nobody can hand out a link for a region
// the live form does not actually recognise.

describe("survey link mapping", () => {
  it("offers every region in the app, so reps can also firm up published figures", () => {
    expect(SURVEY_REGIONS.length).toBe(regions.length);
    for (const option of SURVEY_REGIONS) {
      const region = regions.find((r) => r.id === option.id);
      expect(region, option.id).toBeDefined();
    }
  });

  it("has no duplicate region ids or form values", () => {
    expect(new Set(SURVEY_REGIONS.map((r) => r.id)).size).toBe(SURVEY_REGIONS.length);
    expect(new Set(SURVEY_REGIONS.map((r) => r.formValue)).size).toBe(SURVEY_REGIONS.length);
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

  it("prefills a region that already has published data, not just a gap region", () => {
    const url = buildSurveyFormUrl("tas-north", "french-fry");
    expect(url).toContain("entry.2115047702=Tasmania");
    expect(url).toContain("entry.714400903=Processing");
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
