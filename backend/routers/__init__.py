from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.branches import router as branches_router
from routers.attendance import router as attendance_router
from routers.schedules import router as schedules_router
from routers.dayoffs import router as dayoffs_router
from routers.holidays import router as holidays_router
from routers.inventory import router as inventory_router
from routers.products import router as products_router
from routers.sales import router as sales_router
from routers.reports import router as reports_router

all_routers = [
    auth_router,
    users_router,
    branches_router,
    attendance_router,
    schedules_router,
    dayoffs_router,
    holidays_router,
    inventory_router,
    products_router,
    sales_router,
    reports_router,
]
