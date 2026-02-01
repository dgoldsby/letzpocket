import { mailchimpService } from '../mailchimp';
import { MailchimpResponse } from '../mailchimp';

// Mock fetch globally
global.fetch = jest.fn();

// Mock crypto for MD5 hashing
jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => 'mocked-hash')
    }))
  }))
}));

describe('Mailchimp Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REACT_APP_MAILCHIMP_API_KEY = 'test-api-key';
    process.env.REACT_APP_MAILCHIMP_SERVER_PREFIX = 'us6';
    process.env.REACT_APP_MAILCHIMP_LIST_ID = 'test-list-id';
  });

  describe('addSubscriber', () => {
    it('should successfully add a subscriber in development mode', async () => {
      // Remove API key to trigger development mode
      delete process.env.REACT_APP_MAILCHIMP_API_KEY;

      const result = await mailchimpService.addSubscriber('test@example.com', 'John', 'Doe');

      expect(result).toEqual({
        success: true,
        message: 'Successfully subscribed to newsletter!'
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should successfully add a subscriber with API call', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'member-id' })
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mailchimpService.addSubscriber('test@example.com', 'John', 'Doe', 'landing_page');

      expect(fetch).toHaveBeenCalledWith(
        `https://us6.api.mailchimp.com/3.0/lists/test-list-id/members`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'apikey test-api-key',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email_address: 'test@example.com',
            status: 'pending',
            merge_fields: {
              FNAME: 'John',
              LNAME: 'Doe',
              SIGNUP_SOURCE: 'landing_page'
            },
            tags: ['Landing Page']
          })
        }
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('check your email');
    });

    it('should handle existing member gracefully', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ 
          title: 'Member Exists',
          detail: 'test@example.com is already a list member.'
        })
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mailchimpService.addSubscriber('existing@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('already subscribed');
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ 
          title: 'Invalid Resource',
          detail: 'The email address is not valid.'
        })
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mailchimpService.addSubscriber('invalid@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to subscribe');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await mailchimpService.addSubscriber('test@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to subscribe');
    });
  });

  describe('addWarmLead', () => {
    it('should successfully add a warm lead in development mode', async () => {
      delete process.env.REACT_APP_MAILCHIMP_API_KEY;

      const result = await mailchimpService.addWarmLead(
        'lead@example.com',
        'John',
        'Doe',
        '+1234567890',
        'Test Company',
        '5'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Free review request received');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should successfully add a warm lead with API call', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'member-id' })
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mailchimpService.addWarmLead(
        'lead@example.com',
        'John',
        'Doe',
        '+1234567890',
        'Test Company',
        '5'
      );

      expect(fetch).toHaveBeenCalledWith(
        `https://us6.api.mailchimp.com/3.0/lists/test-list-id/members`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'apikey test-api-key',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email_address: 'lead@example.com',
            status: 'subscribed',
            merge_fields: {
              FNAME: 'John',
              LNAME: 'Doe',
              PHONE: '+1234567890',
              COMPANY: 'Test Company',
              PROPERTIES: '5'
            },
            tags: ['Free Review', 'Warm Lead', 'High Priority']
          })
        }
      );
      expect(result.success).toBe(true);
    });

    it('should handle existing warm lead', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ 
          title: 'Member Exists'
        })
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mailchimpService.addWarmLead('existing@example.com', 'John');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Welcome back');
    });

    it('should handle API errors for warm leads', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ 
          title: 'Invalid Resource',
          detail: 'Invalid email format'
        })
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mailchimpService.addWarmLead('invalid@example.com', 'John');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to process your request');
    });
  });

  describe('addUser', () => {
    it('should successfully add a user in development mode', async () => {
      delete process.env.REACT_APP_MAILCHIMP_API_KEY;

      const result = await mailchimpService.addUser(
        'user@example.com',
        'John',
        'Doe',
        '+1234567890',
        'Test Company',
        'Premium'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Welcome to LetzPocket');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should successfully add a user with API call', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'member-id' })
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mailchimpService.addUser(
        'user@example.com',
        'John',
        'Doe',
        '+1234567890',
        'Test Company',
        'Premium'
      );

      expect(fetch).toHaveBeenCalledWith(
        `https://us6.api.mailchimp.com/3.0/lists/test-list-id/members`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'apikey test-api-key',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email_address: 'user@example.com',
            status: 'subscribed',
            merge_fields: {
              FNAME: 'John',
              LNAME: 'Doe',
              PHONE: '+1234567890',
              COMPANY: 'Test Company'
            },
            tags: ['User', 'Premium']
          })
        }
      );
      expect(result.success).toBe(true);
    });

    it('should handle existing user', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ 
          title: 'Member Exists'
        })
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mailchimpService.addUser('existing@example.com', 'John', 'Doe');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Welcome back');
    });
  });

  describe('updateMember', () => {
    it('should successfully update member in development mode', async () => {
      delete process.env.REACT_APP_MAILCHIMP_API_KEY;

      const result = await mailchimpService.updateMember('test@example.com', {
        merge_fields: { FNAME: 'Updated' }
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Profile updated');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should successfully update member with API call', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'member-id' })
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mailchimpService.updateMember('test@example.com', {
        merge_fields: { FNAME: 'Updated' }
      });

      expect(fetch).toHaveBeenCalledWith(
        `https://us6.api.mailchimp.com/3.0/lists/test-list-id/members/mocked-hash`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': 'apikey test-api-key',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            merge_fields: { FNAME: 'Updated' }
          })
        }
      );
      expect(result.success).toBe(true);
    });

    it('should handle update errors', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ 
          detail: 'Member not found'
        })
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mailchimpService.updateMember('notfound@example.com', {
        merge_fields: { FNAME: 'Updated' }
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to update profile');
    });
  });

  describe('createCampaign', () => {
    it('should successfully create campaign in development mode', async () => {
      delete process.env.REACT_APP_MAILCHIMP_API_KEY;

      const result = await mailchimpService.createCampaign(
        'Test Subject',
        'Test Content'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Campaign created');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should successfully create campaign with API call', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'campaign-id' })
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mailchimpService.createCampaign(
        'Test Subject',
        'Test Content',
        'segment-123'
      );

      expect(fetch).toHaveBeenCalledWith(
        `https://us6.api.mailchimp.com/3.0/campaigns`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'apikey test-api-key',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'regular',
            recipients: {
              list_id: 'test-list-id',
              segment_opts: { id: 'segment-123' }
            },
            settings: {
              subject_line: 'Test Subject',
              from_name: 'LetzPocket',
              reply_to: 'hello@letz-pocket.app',
              template_id: null
            }
          })
        }
      );
      expect(result.success).toBe(true);
    });

    it('should handle campaign creation errors', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ 
          detail: 'Invalid campaign data'
        })
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mailchimpService.createCampaign(
        'Test Subject',
        'Test Content'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to create campaign');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed API responses', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mailchimpService.addSubscriber('test@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to subscribe');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      (fetch as jest.Mock).mockRejectedValue(timeoutError);

      const result = await mailchimpService.addSubscriber('test@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to subscribe');
    });
  });

  describe('Configuration', () => {
    it('should use correct API endpoint format', async () => {
      const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({}) };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await mailchimpService.addSubscriber('test@example.com');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\/us6\.api\.mailchimp\.com\/3\.0\/lists\/test-list-id\/members$/),
        expect.any(Object)
      );
    });

    it('should handle different server prefixes', async () => {
      process.env.REACT_APP_MAILCHIMP_SERVER_PREFIX = 'us1';
      
      const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({}) };
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await mailchimpService.addSubscriber('test@example.com');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\/us1\.api\.mailchimp\.com\/3\.0\/lists\/test-list-id\/members$/),
        expect.any(Object)
      );
    });
  });
});
