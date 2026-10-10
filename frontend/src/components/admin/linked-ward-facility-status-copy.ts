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

export function bulkLinkedWardFacilityStatusDescription(
  scope: LinkedStatusScope,
  nextStatus: 'active' | 'inactive',
  options: { selectionCount: number; uniqueWardCount?: number },
): string {
  const verb = nextStatus === 'active' ? 'activate' : 'deactivate'
  const state = nextStatus === 'active' ? 'activated' : 'deactivated'
  const { selectionCount: n, uniqueWardCount } = options

  if (scope === 'ward') {
    const wardLabel = n === 1 ? 'this ward' : `these ${n} wards`
    return `This will ${verb} ${wardLabel} and each ward's linked health facilities. They stay ${state} together.`
  }

  const facilityLabel =
    n === 1 ? 'this health facility' : `these ${n} health facilities`
  const unique = uniqueWardCount ?? n

  if (unique < n) {
    const wardPhrase =
      unique === 1 ? 'its ward' : `${unique} wards`
    return `This will ${verb} ${facilityLabel}. Some selections share a ward, so ${wardPhrase} and every health facility in ${unique === 1 ? 'that ward' : 'those wards'} will be updated. They stay ${state} together.`
  }

  return `This will ${verb} ${facilityLabel}, ${unique === 1 ? 'its ward' : 'their wards'}, and every health facility in ${unique === 1 ? 'that ward' : 'those wards'}. They stay ${state} together.`
}
