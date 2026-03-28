(function (global) {
  'use strict';
  var ROLE = { SUPER: 'super-user', FIRM_ADMIN: 'firm-admin', LAWYER: 'lawyer', CLIENT: 'client' };
  function normalizeSystemRole(user) {
    if (!user) return ROLE.CLIENT;
    if (user.systemRole) return user.systemRole;
    if (user.id && String(user.id).indexOf('SU') === 0) return ROLE.SUPER;
    if (user.badgeRole === 'manager') return ROLE.FIRM_ADMIN;
    if (user.badgeRole === 'lawyer') return ROLE.LAWYER;
    return ROLE.CLIENT;
  }
  function canAccessFirmAdminArea(sessionUser, canonicalUser) {
    var role = canonicalUser ? normalizeSystemRole(canonicalUser) : normalizeSystemRole(sessionUser || {});
    return role !== ROLE.CLIENT;
  }
  function canCreateUsers(sessionUser, canonicalUser) {
    var r = canonicalUser ? normalizeSystemRole(canonicalUser) : normalizeSystemRole(sessionUser || {});
    return r === ROLE.SUPER || r === ROLE.FIRM_ADMIN;
  }
  function canEditUser(sessionCanonical, targetUser) {
    var sr = normalizeSystemRole(sessionCanonical);
    var tr = normalizeSystemRole(targetUser);
    if (sr === ROLE.LAWYER || sr === ROLE.CLIENT) return false;
    if (sr === ROLE.FIRM_ADMIN && tr === ROLE.SUPER) return false;
    return sr === ROLE.SUPER || sr === ROLE.FIRM_ADMIN;
  }
  function canDeleteUser(sessionCanonical, targetUser) {
    var sr = normalizeSystemRole(sessionCanonical);
    var tr = normalizeSystemRole(targetUser);
    if (sr === ROLE.LAWYER || sr === ROLE.CLIENT) return false;
    if (tr === ROLE.SUPER && sr !== ROLE.SUPER) return false;
    if (sr === ROLE.FIRM_ADMIN && tr === ROLE.SUPER) return false;
    return sr === ROLE.SUPER || sr === ROLE.FIRM_ADMIN;
  }
  global.LexFlowRoles = { ROLE: ROLE, normalizeSystemRole: normalizeSystemRole, canAccessFirmAdminArea: canAccessFirmAdminArea, canCreateUsers: canCreateUsers, canEditUser: canEditUser, canDeleteUser: canDeleteUser };
})(typeof window !== 'undefined' ? window : globalThis);
