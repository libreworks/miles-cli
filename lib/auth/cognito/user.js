const { CognitoUser } = require("amazon-cognito-identity-js");
const { User } = require("../user");

const COGNITO_USER = Symbol("cognitoUser");

class CognitoIdpUser extends User {
  constructor(username, cognitoUser) {
    super(username);
    this[COGNITO_USER] = cognitoUser;
  }

  get provider() {
    return "cognito";
  }

  /**
   * @return {@amazon-cognito-identity-js.CognitoUser} The Cognito user
   */
  get cognitoUser() {
    return this[COGNITO_USER];
  }

  /**
   * Resume a Cognito session if possible.
   *
   * @return {Promise<@amazon-cognito-identity-js.CognitoUserSession>} The promised CognitoUserSession
   */
  getCognitoSession() {
    return new Promise((resolve, reject) => {
      this[COGNITO_USER].getSession((err, session) => {
        if (err) {
          reject(err);
        } else {
          if (session.isValid()) {
            resolve(session);
          } else {
            reject(new Error("Cognito session refreshed but is invalid"));
          }
        }
      });
    });
  }

  async getLabel() {
    const session = await this.getCognitoSession();
    return `Amazon Cognito user: ${session.getIdToken().payload.email} (${
      this.username
    })`;
  }
}

module.exports = { CognitoIdpUser };
