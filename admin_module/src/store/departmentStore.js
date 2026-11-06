import {create} from 'zustand';

const useDepartmentStore =create((set)=>({
    departments:[],

    setDepartments:(data)=>{
        set({departments:data});
    }
}))

export default useDepartmentStore;