import { getRoleHomePath } from '~/utils/roleRoute'

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()

  if (to.path === '/masuk' && loggedIn.value) {
    return navigateTo(getRoleHomePath(user.value?.role))
  }
})
