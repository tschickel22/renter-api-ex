import { configureStore } from '@reduxjs/toolkit'

import dashboardReducer from '../slices/dashboardSlice'
import userReducer from '../slices/userSlice'
import companyReducer from '../slices/companySlice'
import unitReducer from '../slices/unitSlice'
import leaseReducer from '../slices/leaseSlice'
import leaseResidentReducer from '../slices/leaseResidentSlice'
import residentReducer from '../slices/residentSlice'
import residentPetReducer from '../slices/residentPetSlice'
import residentVehicleReducer from '../slices/residentVehicleSlice'

export default configureStore({
    reducer: {
        dashboard: dashboardReducer,
        user: userReducer,
        company: companyReducer,
        unit: unitReducer,
        lease: leaseReducer,
        leaseResident: leaseResidentReducer,
        resident: residentReducer,
        residentPet: residentPetReducer,
        residentVehicle: residentVehicleReducer
    },
})