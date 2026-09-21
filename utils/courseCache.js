const FULL_TTL_MS = 10 * 60 * 1000;
const PURCHASED_TTL_MS = 2 * 60 * 1000;

const fullCache = new Map();
const fullInflight = new Map();
let purchasedCache = null;

export function getCachedCourseFull(courseId) {
  const key = String(courseId);
  const hit = fullCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > FULL_TTL_MS) {
    fullCache.delete(key);
    return null;
  }
  return hit.course;
}

export function setCachedCourseFull(courseId, course) {
  if (!course) return;
  fullCache.set(String(courseId), { course, at: Date.now() });
}

export function clearCachedCourseFull(courseId) {
  if (courseId == null) {
    fullCache.clear();
    fullInflight.clear();
    return;
  }
  const key = String(courseId);
  fullCache.delete(key);
  fullInflight.delete(key);
}

export function getCachedPurchasedCourses() {
  if (!purchasedCache) return null;
  if (Date.now() - purchasedCache.at > PURCHASED_TTL_MS) {
    purchasedCache = null;
    return null;
  }
  return purchasedCache.list;
}

export function setCachedPurchasedCourses(list) {
  purchasedCache = { list: Array.isArray(list) ? list : [], at: Date.now() };
}

export function invalidatePurchasedCoursesCache() {
  purchasedCache = null;
}

/** Dedupe concurrent /full fetches for the same course. */
export async function withCourseFullInflight(courseId, loader) {
  const key = String(courseId);
  const cached = getCachedCourseFull(key);
  if (cached) return cached;
  if (fullInflight.has(key)) return fullInflight.get(key);

  const promise = Promise.resolve()
    .then(loader)
    .then((course) => {
      setCachedCourseFull(key, course);
      return course;
    })
    .finally(() => {
      fullInflight.delete(key);
    });

  fullInflight.set(key, promise);
  return promise;
}
