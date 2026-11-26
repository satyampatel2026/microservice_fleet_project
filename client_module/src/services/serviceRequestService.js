const BASE_URL="/api/client/service-requests";

async function request(path="", {method="GET", body, signal}={}){
    const response =await fetch(`${BASE_URL}${path}`,{
        method,
        credentials:"include",
        headers:body?{"Content-Type":"application/json"}:undefined,
        body:body?JSON.stringify(body):undefined,
        signal
    })
    const result=await response.json().catch(()=>{{}})
    if(!response.ok || result.success !==true){
        const error= new Error(result.message || "service request failed");
        error.status=response.status;
        throw error;        
    }
    return result;
}
export const getServiceRequestOptions=signal=>
    request("/options",{signal});   

export const getMyServiceRequests=signal=>
    request("",{signal});

export const createServiceRequest=data=>
    request("",{method:"POST",body:data});

export const cancelServiceRequest=requestId =>
    request(`/${requestId}/cancel`,{method:"PATCH"});

export const getServiceRequestQuote = (requestId) =>
  request(`/${requestId}/quote`);

export function decideServiceRequestQuote(requestId, quoteId, decision, shownSubtotal) {
  return request(`/${requestId}/quotes/${quoteId}/decision`, {
    method: "PATCH",
    body: { decision, shownSubtotal },
  });
}