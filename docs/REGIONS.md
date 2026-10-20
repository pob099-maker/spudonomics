# PotatoLink regions and areas (PT26001)

**Source of truth: the PT26001 PotatoLink 2 proposal** (Table 1, "Regional Summary", and the team section). This file is copied into both the Rep CRM and the PT25003 consultation tool. Change it in one place, then copy it to the other, so the two tools never disagree.

## Two layers

- **Region** (7): the reporting region. Each is led by one person, and the six led by regional representatives match the proposal's six regional plans and six Regional Advisory Groups.
- **Area** (12): the growing area inside a region, taken directly from Table 1. Areas are how differences inside a region stay visible (priorities, delivery style, seasonal timing, demonstration sites).

Region is always **derived from area**, never entered separately, so a record cannot say "Ballarat" for one and "Vic" for the other.

| Region id | Region | Lead | Area id | Area | Key themes in Table 1 | States |
| --- | --- | --- | --- | --- | --- | --- |
| sa | South Australia and borders | New SA rep (TBC) | mallee-loxton | Mallee / Loxton | Disease (black dot), soil health, irrigation | Vic, SA |
| sa | South Australia and borders | New SA rep (TBC) | murray-bridge-adelaide-plains | Murray Bridge / Adelaide Plains | Soil health, yield, powdery scab, black dot, nematodes | SA |
| sa | South Australia and borders | New SA rep (TBC) | mt-gambier-warrnambool | Mt Gambier / Warrnambool | Soil health, water use efficiency and quality, seed quality and handling, crop protection | SA, Vic |
| tas | Tasmania | Seona Findlay | midlands-longford | Midlands / Longford | Disease, soil health, irrigation, nutrition, cost of production | Tas |
| tas | Tasmania | Seona Findlay | ne-tas-scottsdale | NE Tasmania / Scottsdale | Disease, nutrition, soil health, seed handling, farm economics | Tas |
| tas | Tasmania | Seona Findlay | nw-tas-sisters-creek | NW Tasmania / Sisters Creek | Seed quality, volunteers, soil borne disease, irrigation | Tas |
| ballarat | Ballarat | Stuart Grigg | ballarat | Ballarat | Nutrition, soil health, technology, disease, irrigation | Vic |
| gippsland | Gippsland | Bonnie Dawson | gippsland-thorpdale | Gippsland / Thorpdale | Disease and pest management, nutrition, soil health | Vic |
| qld | Queensland | Naomi Diplock | atherton | Atherton | Seed quality and variety selection, pest and disease, cover crops | Qld |
| qld | Queensland | Naomi Diplock | lockyer-bundaberg | Lockyer Valley and Bundaberg | Disease, rotations, soil health | Qld |
| wa | Western Australia | Rachel Lancaster | manjimup-jindong | Manjimup / Jindong | Disease, seed quality and storage, irrigation, yield | WA |
| nsw | New South Wales | Peter O'Brien (national coordinator) | riverina-tablelands-coast | Riverina, Tablelands, Coast | Biosecurity and seed, soil health, disease, input use efficiency | NSW |

State is shown for information only (two areas straddle the Victoria / South Australia border). It is not a reporting layer.

## Rules both tools follow

1. **Ids are identifiers, labels are wording.** Ids above never change; display names can. Renaming an id orphans history.
2. **Every record carries an area.** If an activity truly spans areas, choose the main one. National or online-only activities carry no area and are flagged as national rather than given a region they don't belong to.
3. **Reports show both layers.** Regional totals first, with the area breakdown underneath.
4. **Small groups are suppressed at each layer.** Anything under 5 people is not shown for an area; it rolls up into its region, and if the region is still under 5, into the total.
5. **NSW counts in every national figure** even though the proposal funds six regional plans and six Regional Advisory Groups. Whether NSW gets an advisory group is an open decision.
6. **Regions and areas are added here first**, then in the tools.

## Open questions

- Does NSW get a Regional Advisory Group, or is it consulted through the national advisor network?
- Should NSW be split into areas (Riverina, Tablelands, Coast) once activity starts? The proposal lists it as one row.
- Who covers South Australia until the new rep is appointed?
- Are further areas likely as the project runs? Adding one only needs a new area id here.
