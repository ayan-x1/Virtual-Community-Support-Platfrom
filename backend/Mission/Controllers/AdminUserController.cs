using Microsoft.AspNetCore.Mvc;
using Mission.Entities;
using Mission.Entities.Models;
using Mission.Services;
using Mission.Services.IServices;

namespace Mission.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminUserController(IAdminUserService _adminUserService) : Controller
    {
        [HttpGet]
        [Route("UserDetailList")]
        public ActionResult UserDetailList()
        {
            try
            {
                var res = _adminUserService.UserDetailsList();
                return Ok(new ResponseResult() { Data = res, Result = ResponseStatus.Success, Message = "" });
            }
            catch
            {
                return BadRequest(new ResponseResult() { Data = null, Result = ResponseStatus.Error, Message = "Failed to get user list" });
            }
        }

        [HttpDelete("DeleteUser/{id:int}")]
        public ActionResult DeleteUser(int id)
        {
            try
            {
                var res = _adminUserService.UserDelete(id);
                return Ok(new ResponseResult() { Data = res, Result = ResponseStatus.Success, Message = "" });
            }
            catch
            {
                return BadRequest(new ResponseResult() { Data = null, Result = ResponseStatus.Error, Message = "Failed to delete user" });
            }
        }

        [HttpPut("UpdateUser")]
        public async Task<ActionResult> UpdateUser([FromForm] UserUpdateRequest request)
        {
            try
            {
                // Handle image upload if provided
                string? imagePath = null;
                if (request.ProfileImage != null && request.ProfileImage.Length > 0)
                {
                    // Validate image file
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                    var fileExtension = Path.GetExtension(request.ProfileImage.FileName).ToLowerInvariant();

                    if (!allowedExtensions.Contains(fileExtension))
                    {
                        return BadRequest(new ResponseResult()
                        {
                            Data = null,
                            Result = ResponseStatus.Error,
                            Message = "Invalid file type. Only JPG, JPEG, PNG, and GIF files are allowed."
                        });
                    }

                    // Validate file size (5MB limit)
                    if (request.ProfileImage.Length > 5 * 1024 * 1024)
                    {
                        return BadRequest(new ResponseResult()
                        {
                            Data = null,
                            Result = ResponseStatus.Error,
                            Message = "File size exceeds 5MB limit."
                        });
                    }

                    // Generate unique filename
                    var fileName = Guid.NewGuid().ToString() + fileExtension;
                    var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "UploadMissionImage");

                    // Create directory if it doesn't exist
                    if (!Directory.Exists(uploadsPath))
                    {
                        Directory.CreateDirectory(uploadsPath);
                    }

                    var filePath = Path.Combine(uploadsPath, fileName);

                    // Save file
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await request.ProfileImage.CopyToAsync(stream);
                    }

                    imagePath = fileName; // Store relative path
                }

                // Create UserDetails object
                var userDetails = new UserDetails
                {
                    Id = request.Id,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PhoneNumber = request.PhoneNumber,
                    EmailAddress = request.EmailAddress,
                    UserType = request.UserType,
                    ProfileImage = imagePath ?? request.ExistingProfileImage // Keep existing if no new image
                };

                var res = _adminUserService.UpdateUser(userDetails);
                return Ok(new ResponseResult() { Data = res, Result = ResponseStatus.Success, Message = "User updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new ResponseResult()
                {
                    Data = null,
                    Result = ResponseStatus.Error,
                    Message = $"Failed to update user: {ex.Message}"
                });
            }
        }
    }

    // Request model for handling form data with file upload
    public class UserUpdateRequest
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string EmailAddress { get; set; } = string.Empty;
        public string? UserType { get; set; }
        public IFormFile? ProfileImage { get; set; }
        public string? ExistingProfileImage { get; set; }
        public bool IsImageChanged { get; set; }
    }
}