import { describe, expect, it, vi, beforeEach } from "vitest";
import { SURVEY_REGIONS } from "../data/surveyLinks";

const selectMock = vi.fn();
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock("./supabaseClient", () => ({
  supabase: { from: fromMock },
}));

const { fetchResponseCountsByRegion, totalResponses } = await import("./surveyStats");

describe("fetchResponseCountsByRegion", () => {
  beforeEach(() => {
    selectMock.mockReset();
    fromMock.mockClear();
  });

  it("only ever reads the aggregated spudonomics_response_counts view, never a raw response row", async () => {
    selectMock.mockResolvedValue({ data: [], error: null });
    await fetchResponseCountsByRegion();
    expect(fromMock).toHaveBeenCalledWith("spudonomics_response_counts");
    expect(selectMock).toHaveBeenCalledWith("region, segment, response_count");
  });

  it("lists every region even when it has zero responses", async () => {
    selectMock.mockResolvedValue({ data: [], error: null });
    const result = await fetchResponseCountsByRegion();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(SURVEY_REGIONS.length);
      expect(result.data.every((row) => row.count === 0)).toBe(true);
    }
  });

  it("sums counts across market segments within the same region", async () => {
    const region = SURVEY_REGIONS[0];
    selectMock.mockResolvedValue({
      data: [
        { region: region.formValue, segment: "Seed", response_count: 2 },
        { region: region.formValue, segment: "Processing - Crisps", response_count: 3 },
      ],
      error: null,
    });
    const result = await fetchResponseCountsByRegion();
    expect(result.success).toBe(true);
    if (result.success) {
      const row = result.data.find((r) => r.regionId === region.id);
      expect(row?.count).toBe(5);
      expect(totalResponses(result.data)).toBe(5);
    }
  });

  it("returns a friendly error when the query fails", async () => {
    selectMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    const result = await fetchResponseCountsByRegion();
    expect(result.success).toBe(false);
  });
});
