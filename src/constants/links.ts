export enum RouterLinks {
  //#region Assets
  addAssets = '/assets/add',
  //#endregion
  //#region Modules
  getModules = '/modules',
  //#endregion
  //#region Packages
  getPackages = '/packages/:moduleId',
  //#endregion
  //#region Providers
  getAllProviders = '/providers',
  getOneProvider = '/providers/one',
  //#endregion
  //#region Services
  getServices = '/services',
  //#endregion
  //#region Users
  login = '/login',
  register = '/register',
  checkUserExist = '/checkUserExist',
  //#endregion
  //#region Values
  getValues = '/values',
  //#endregion
  //#region Cars
  getCars = '/cars',
  getOneCar = '/cars/one',
  getBodyTypes = '/cars/bodyTypes',
  addCar = '/cars/add',
  verifyCarNumber = '/car/checkCarExist/:plateNumber',
  getAllCities = '/car/cities',
  //#endregion
  //#region Orders
  addOrder = '/orders/add',
  getOneOrder = '/orders/one/:id',
  //#endregion
}
