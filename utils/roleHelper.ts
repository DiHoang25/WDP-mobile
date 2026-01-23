/**
 * Helper functions for role-based routing
 */

/**
 * Get route path based on roleId
 * @param roleId - User role ID (1: citizen, 2: enterprise, 3: collector/shipper, 4: admin)
 * @returns Route path string
 */
export function getRouteByRoleId(roleId: number | undefined): string {
  if (!roleId) {
    return "/login";
  }

  switch (roleId) {
    case 1: // citizen
      return "/(citizen)";
    case 2: // enterprise
      return "/(enterprise)";
    case 3: // collector/shipper
      return "/(shipper)";
    case 4: // admin
      return "/(admin)";
    default:
      return "/login";
  }
}

/**
 * Get role name from roleId
 * @param roleId - User role ID
 * @returns Role name string
 */
export function getRoleNameByRoleId(roleId: number | undefined): string {
  if (!roleId) {
    return "unknown";
  }

  switch (roleId) {
    case 1:
      return "citizen";
    case 2:
      return "enterprise";
    case 3:
      return "shipper";
    case 4:
      return "admin";
    default:
      return "unknown";
  }
}
