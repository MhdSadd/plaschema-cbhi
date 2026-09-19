export type LinkedStatusScope = 'ward' | 'facility'

export function linkedWardFacilityStatusDescription(
  scope: LinkedStatusScope,
  nextStatus: 'active' | 'inactive',
  options?: { wardName?: string; linkedFacilityCount?: number },
): string {
  const verb = nextStatus === 'active' ? 'activate' : 'deactivate'
  const state = nextStatus === 'active' ? 'activated' : 'deactivated'

  if (scope === 'ward') {
    const count = options?.linkedFacilityCount ?? 0
    const facilityPhrase =
      count === 0
        ? 'any health facilities in this ward'
        : count === 1
          ? 'its linked health facility'
          : `all ${count} linked health facilities`
    return `This will ${verb} this ward and ${facilityPhrase}. They stay ${state} together.`
  }

  const wardLabel = options?.wardName ? `the ${options.wardName} ward` : 'its ward'
  return `This will ${verb} this facility, ${wardLabel}, and every health facility in that ward. They stay ${state} together.`
}
