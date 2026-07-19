function skillsMember(name, role, skills) {
  return {
    name: name || 'Unknown',
    role: role || 'Member',
    skills: Array.isArray(skills) ? skills : [],
    joinedAt: new Date().toISOString(),
    isActive: true
  };
}

module.exports = { skillsMember };
