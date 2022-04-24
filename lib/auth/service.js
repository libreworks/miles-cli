const CONFIG_SERVICE = Symbol("configService");
const AUTH_ADAPTER = Symbol("authAdapter");

/**
 * Locates the authentication adapter.
 *
 * @param {container.Container} container - The dependency injection container
 * @param {string} [name=cognito] - The name of the adapter to locate.
 * @return {AuthAdapter} The authentication adapter found.
 */
async function locateAuthAdapter(container, name = "cognito") {
  let authAdapter;

  if (container.has(`auth.adapter.${name}`)) {
    authAdapter = await container.get(`auth.adapter.${name}`);
  } else {
    const adapters = await container.getAllTagged("auth-adapter");
    authAdapter = adapters.find((a) => name === a.name);
  }

  if (!authAdapter) {
    throw new Error(`No authentication adapter found for name: ${name}`);
  }

  return authAdapter;
}

/**
 * Handles authentication.
 */
class AuthService {
  /**
   * Creates a new AuthService.
   *
   * @param {ConfigService} configService - The config service.
   * @param {AuthAdapter} authAdapter - The auth adapter.
   */
  constructor(configService, authAdapter) {
    this[CONFIG_SERVICE] = configService;
    this[AUTH_ADAPTER] = authAdapter;
  }

  /**
   * Creates a new AuthService.
   *
   * @param {container.Container} - The dependency injection container.
   */
  static async create(container) {
    const [configService] = await container.getAll(["config.service"]);
    const authAdapterName = await configService.get("auth", "adapter");
    const authAdapter = await locateAuthAdapter(container, authAdapterName);
    return new AuthService(configService, authAdapter);
  }

  /**
   * Gets the current user.
   *
   * @return {User} The current user (may be anonymous or authenticated)
   */
  get user() {
    return this[AUTH_ADAPTER].user;
  }

  logIn() {
    return this[AUTH_ADAPTER].logIn();
  }

  async logOut() {
    return await this[AUTH_ADAPTER].logOut();
  }
}

module.exports = AuthService;
