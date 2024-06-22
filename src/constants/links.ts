export enum RouterLinks {
  //#region Attachments
  getAllAttachmentTypes = '/attachments/getTypes',
  getListOfAttachments = '/attachments/getListOfAttachments/:typeName',
  uploadAttachments = '/attachments/upload/:userId/:attachmentTypeId',
  getImage = '/attachments/getImages',
  //#endregion
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
  getOneProvider = '/providers/one/:id',
  addProviderService = '/providers/services/create/:moduleId',
  //#endregion
  //#region Services
  getAllProviderServices = '/services/:moduleId/:providerId',
  getAllServices = '/services/:moduleId',
  //#endregion
  //#region Users
  login = '/login',
  register = '/register',
  checkUserExist = '/checkUserExist',
  //#endregion
  //#region Values
  getValues = '/values',
  //#endregion
  //#region Payment methods
  getAllPaymentMethods = '/payment/methods',
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
  getOrderTotalAmountStatements = '/orders/getOrderStatements',
  //#endregion
  //#region Constants
  getAllConstants = '/constants',
  modifyConstant = '/constants/update',
  //#endregion
}
