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
    isAdmin: !!user.isAdmin,
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
      : undefined,
    likesCount: p._count ? p._count.likes : 0,
    likedByMe: Array.isArray(p.likes) ? p.likes.length > 0 : false,
    savedByMe: Array.isArray(p.saves) ? p.saves.length > 0 : false
  };
}

function notification(n) {
  return {
    id: n.id,
    type: n.type,
    read: n.read,
    createdAt: n.createdAt,
    actor: {
      id: n.actor.id,
      username: n.actor.username,
      displayName: n.actor.displayName,
      avatarUrl: n.actor.avatarUrl
    },
    post: n.post ? { id: n.post.id, imageUrl: n.post.imageUrl } : null
  };
}

module.exports = { publicUser, me, post, notification };
