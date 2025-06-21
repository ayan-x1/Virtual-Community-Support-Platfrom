using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Mission.Entities;
using Mission.Entities.Models;
using Mission.Service.IServices;
using Mission.Services.IServices;

namespace Mission.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MissionController(IMissionService missionService, ICommonService _commonService) : ControllerBase
    {
        private readonly IMissionService _missionService = missionService;

        [HttpPost]
        [Route("AddMission")]
        public async Task<IActionResult> AddMission(MissionRequestViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ResponseResult()
                {
                    Data = null,
                    Result = ResponseStatus.Error,
                    Message = "Invalid model data"
                });
            }

            try
            {
                var response = await _missionService.AddMission(model);
                return Ok(new ResponseResult() { Data = response, Result = ResponseStatus.Success, Message = "" });
            }
            catch (Exception ex)
            {
                return BadRequest(new ResponseResult()
                {
                    Data = null,
                    Result = ResponseStatus.Error,
                    Message = ex.Message
                });
            }
        }

        [HttpPut]
        [Route("UpdateMission")]
        public async Task<IActionResult> UpdateMission(MissionRequestViewModel model)
        {
            // Log the incoming model
            Console.WriteLine($"Received model: {System.Text.Json.JsonSerializer.Serialize(model)}");

            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value.Errors.Count > 0)
                    .Select(x => new { Field = x.Key, Errors = x.Value.Errors.Select(e => e.ErrorMessage) })
                    .ToArray();

                Console.WriteLine($"Model validation errors: {System.Text.Json.JsonSerializer.Serialize(errors)}");

                return BadRequest(new ResponseResult()
                {
                    Data = errors,
                    Result = ResponseStatus.Error,
                    Message = "Model validation failed"
                });
            }

            try
            {
                var response = await _missionService.UpdateMission(model);
                return Ok(new ResponseResult()
                {
                    Data = response,
                    Result = ResponseStatus.Success,
                    Message = response ? "Mission updated successfully" : "Failed to update mission"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdateMission: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");

                return BadRequest(new ResponseResult()
                {
                    Data = null,
                    Result = ResponseStatus.Error,
                    Message = ex.Message
                });
            }
        }

        [HttpDelete]
        [Route("DeleteMission/{id:int}")]
        public async Task<IActionResult> DeleteMission(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new ResponseResult()
                {
                    Data = null,
                    Result = ResponseStatus.Error,
                    Message = "Invalid mission ID"
                });
            }

            try
            {
                var response = await _missionService.DeleteMission(id);
                return Ok(new ResponseResult()
                {
                    Data = response,
                    Result = ResponseStatus.Success,
                    Message = response ? "Mission deleted successfully" : "Failed to delete mission"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ResponseResult()
                {
                    Data = null,
                    Result = ResponseStatus.Error,
                    Message = ex.Message
                });
            }
        }

        [HttpGet]
        [Route("MissionList")]
        public async Task<IActionResult> GetAllMissionAsync()
        {
            try
            {
                var response = await _missionService.GetAllMissionAsync();
                return Ok(new ResponseResult() { Data = response, Result = ResponseStatus.Success, Message = "" });
            }
            catch (Exception ex)
            {
                return BadRequest(new ResponseResult()
                {
                    Data = null,
                    Result = ResponseStatus.Error,
                    Message = ex.Message
                });
            }
        }

        [HttpGet]
        [Route("GetMissionThemeList")]
        public ResponseResult MissionThemeList()
        {
            ResponseResult result = new ResponseResult();
            try
            {
                result.Data = _commonService.MissionThemeList();
                result.Result = ResponseStatus.Success;
            }
            catch (Exception ex)
            {
                result.Result = ResponseStatus.Error;
                result.Message = ex.Message;
            }
            return result;
        }

        [HttpGet]
        [Route("GetMissionSkillList")]
        public ResponseResult MissionSkillList()
        {
            ResponseResult result = new ResponseResult();
            try
            {
                result.Data = _commonService.MissionSkillList();
                result.Result = ResponseStatus.Success;
            }
            catch (Exception ex)
            {
                result.Result = ResponseStatus.Error;
                result.Message = ex.Message;
            }
            return result;
        }

        [HttpGet]
        [Route("MissionDetailById/{id:int}")]
        public async Task<IActionResult> GetMissionById(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new ResponseResult()
                {
                    Data = null,
                    Result = ResponseStatus.Error,
                    Message = "Invalid mission ID"
                });
            }

            try
            {
                var response = await _missionService.GetMissionById(id);
                return Ok(new ResponseResult() { Data = response, Result = ResponseStatus.Success, Message = "" });
            }
            catch (Exception ex)
            {
                return BadRequest(new ResponseResult()
                {
                    Data = null,
                    Result = ResponseStatus.Error,
                    Message = ex.Message
                });
            }
        }

        [HttpGet]
        [Route("MissionApplicationList")]
        public IActionResult MissionApplicationList()
        {
            try
            {
                var response = _missionService.GetMissionApplicationList();
                return Ok(new ResponseResult() { Data = response, Result = ResponseStatus.Success, Message = "" });
            }
            catch (Exception ex)
            {
                return BadRequest(new ResponseResult()
                {
                    Data = null,
                    Result = ResponseStatus.Error,
                    Message = ex.Message
                });
            }
        }

        [HttpPost]
        [Route("MissionApplicationApprove")]
        public async Task<IActionResult> MissionApplicationApprove([FromBody] UpdateMissionApplicationModel missionApp)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ResponseResult()
                {
                    Data = null,
                    Result = ResponseStatus.Error,
                    Message = "Invalid model data"
                });
            }

            try
            {
                var ret = await _missionService.MissionApplicationApprove(missionApp);
                return Ok(new ResponseResult() { Data = ret, Message = string.Empty, Result = ResponseStatus.Success });
            }
            catch (Exception ex)
            {
                return BadRequest(new ResponseResult() { Data = null, Message = ex.Message, Result = ResponseStatus.Error });
            }
        }

        [HttpPost]
        [Route("MissionApplicationDelete")]
        public async Task<IActionResult> MissionApplicationDelete(DeleteMissionApplicationModel model)
        {
            try
            {
                if (model?.ApplicationId == null || model.ApplicationId <= 0)
                {
                    return BadRequest(new ResponseResult()
                    {
                        Data = null,
                        Message = "Invalid application ID",
                        Result = ResponseStatus.Error
                    });
                }

                var response = await _missionService.DeleteMissionApplication(model.ApplicationId);

                if (response)
                {
                    return Ok(new ResponseResult()
                    {
                        Data = response,
                        Message = "Mission application deleted successfully",
                        Result = ResponseStatus.Success
                    });
                }
                else
                {
                    return NotFound(new ResponseResult()
                    {
                        Data = null,
                        Message = "Mission application not found or already deleted",
                        Result = ResponseStatus.Error
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new ResponseResult()
                {
                    Data = null,
                    Message = ex.Message,
                    Result = ResponseStatus.Error
                });
            }
        }
    }
}