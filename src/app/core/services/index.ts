// CoreModule barrel – import services from here, not from individual files.
// Angular equivalent: CoreModule with providers.

export { AuthService,      authService      } from './AuthService';
export { InventoryService, inventoryService } from './InventoryService';
export { SalesService,     salesService     } from './SalesService';
export { OrdersService,    ordersService    } from './OrdersService';
export { SettingsService,  settingsService  } from './SettingsService';
