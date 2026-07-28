function publicUser(user, { followers = 0, following = 0, posts = 0, isFollowedByMe = undefined } = {}) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    favoriteStores: JSON.parse(user.favoriteStores || '[]'),
    followers,
    following,
    posts,
    ...(isFollowedByMe !== undefined ? { isFollowedByMe } : {})
  };
}

function me(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    favoriteStores: JSON.parse(user.favoriteStores || '[]'),
    subscriptionStatus: user.subscriptionStatus,
    subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd
  };
}

function post(p) {
  return {
    id: p.id,
    imageUrl: p.imageUrl,
    stores: JSON.parse(p.stores || '[]'),
    createdAt: p.createdAt,
    garments: (p.garments || [])
      .sort((a, b) => a.order - b.order)
      .map((g) => ({ id: g.id, name: g.name, colors: JSON.parse(g.colors || '[]') })),
    author: p.user
      ? {
          id: p.user.id,
          username: p.user.username,
          displayName: p.user.displayName,
          avatarUrl: p.user.avatarUrl
        }
      : undefined
  };
}

module.exports = { publicUser, me, post };
